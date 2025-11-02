import requests
import json
import math
import time
import re
from collections import Counter, defaultdict
from typing import List, Dict, Any
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    StartSessionContent,
)
from uagents import Agent, Context, Protocol, Model
from datetime import datetime, timezone
from uuid import uuid4


ASI1_API_KEY = "sk_e6ca5699fe394c2ea28f700c1a1eac6de6f7e4f8a5fd404d97c625a387f3df1e"  # sama pola dengan agent.py (hardcoded)
ASI1_BASE_URL = "https://api.asi1.ai/v1"
ASI1_HEADERS = {
    "Authorization": f"Bearer {ASI1_API_KEY}",
    "Content-Type": "application/json"
}

BACKEND_CANISTER_ID = "uzt4z-lp777-77774-qaabq-cai"

BASE_URL = "http://127.0.0.1:4943"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def with_host(headers: dict, canister_id: str) -> dict:
    return {**headers, "Host": f"{canister_id}.localhost"}

def repair_json(json_text: str) -> str:
    """
    Attempt to repair common JSON syntax issues.
    """
    import re

    original_text = json_text

    # Remove any trailing commas before closing braces/brackets
    json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)

    # Fix missing commas between objects in arrays
    json_text = re.sub(r'}(\s*{)', r'},\1', json_text)

    # Remove duplicate closing braces
    while '}}' in json_text:
        json_text = json_text.replace('}}', '}')

    # Remove duplicate closing brackets
    while ']]' in json_text:
        json_text = json_text.replace(']]', ']')

    # Fix extra closing braces before commas in arrays: },}, -> },{
    json_text = re.sub(r'}(\s*),(\s*)},(\s*{)', r'\1},\3', json_text)

    # More specific pattern for the observed issue: }},{ -> },{
    json_text = re.sub(r'}(\s*)},(\s*{)', r'\1},\2', json_text)

    # Even more specific pattern for the exact issue: "totalTokensSpent":0},},{"id" -> "totalTokensSpent":0},{"id"
    json_text = re.sub(r'(":\s*\d+)\s*},\s*},\s*({)', r'\1},\2', json_text)

    # Alternative pattern: }},{ -> },{
    json_text = re.sub(r'}\s*},\s*{', '},{', json_text)

    # Debug: Check if any repairs were made
    if json_text != original_text:
        print(f"DEBUG: JSON repair made changes. Original length: {len(original_text)}, New length: {len(json_text)}")
        # Find what changed
        for i, (orig, new) in enumerate(zip(original_text, json_text)):
            if orig != new:
                print(f"DEBUG: First change at position {i}: '{orig}' -> '{new}'")
                break

    return json_text

# Cache ringan untuk jobs agar beberapa tools tidak memanggil canister berulang dalam satu sesi
_JOBS_CACHE: Dict[str, Any] = {"data": None, "ts": 0.0}
# BAGIAN 1: Cache untuk users, polanya sama seperti _JOBS_CACHE
_USERS_CACHE: Dict[str, Any] = {"data": None, "ts": 0.0}
_RATINGS_CACHE: Dict[str, Any] = {"data": None, "ts": 0.0}
_CACHE_TTL = 60.0  # detik

# --------------------------
# REST API Models
# --------------------------
class ChatRequest(Model):
    message: str
    userId: str | None = None  # Optional user ID from frontend session

class ChatResponse(Model):
    response: str
    timestamp: str
    status: str

class HealthResponse(Model):
    status: str
    agent_name: str
    agent_address: str
    port: int

class JobsResponse(Model):
    jobs: List[Dict[str, Any]]
    count: int
    timestamp: str
    status: str

# --------------------------
# Tools (function calling)
# --------------------------
# Semua tools hanya membaca data dari getAllJobs

tools = [
    {
        "type": "function",
        "function": {
            "name": "chat_assistant",
            "description": "Generate context-aware message suggestions, translations, and communication improvements based on chat history",
            "parameters": {
                "type": "object",
                "properties": {
                    "chat_history": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "sender_id": {"type": "string"},
                                "message": {"type": "string"},
                                "timestamp": {"type": "string"},
                                "is_read": {"type": "boolean"},
                                "message_type": {"type": "string"}
                            }
                        },
                        "description": "Recent chat history for context"
                    },
                    "current_draft": {
                        "type": "string",
                        "description": "User's current message draft if any"
                    },
                    "user_id": {"type": "string"},
                    "recipient_id": {"type": "string"},
                    "job_context": {
                        "type": "object",
                        "properties": {
                            "job_id": {"type": "string"},
                            "job_name": {"type": "string"},
                            "job_status": {"type": "string"},
                            "deadline": {"type": "string"},
                            "client_id": {"type": "string"}
                        }
                    },
                    "assistance_type": {
                        "type": "string", 
                        "enum": ["suggest_reply", "translate", "optimize_tone", "explain_technical", "prevent_misunderstanding"],
                        "description": "Type of assistance requested"
                    },
                    "source_language": {"type": "string"},
                    "target_language": {"type": "string"}
                },
                "required": ["chat_history", "user_id", "assistance_type"]
            },
            "strict": True,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "getAllJobs",
            "description": "Ambil semua job dari platform (via ICP HTTP).",
            "parameters": {"type": "object", "properties": {}, "required": []},
            "strict": True,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_jobs_by_skills",
            "description": "Rekomendasikan job berdasarkan daftar skill freelancer (cosine similarity TF-IDF sederhana).",
            "parameters": {
                "type": "object",
                "properties": {
                    "skills": {"type": "array", "items": {"type": "string"}},
                    "top_n": {"type": "integer", "default": 5, "minimum": 1, "maximum": 20},
                },
                "required": ["skills"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
    {
        "type": "function",
        "function": {
            "name": "budget_advice",
            "description": "Sarankan rentang budget realistis berdasarkan scope/keywords dan (opsional) tags/slots.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Deskripsi singkat scope pekerjaan."},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "slots": {"type": "integer", "minimum": 1},
                },
                "required": ["scope"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    },
{
    "type": "function",
    "function": {
        "name": "getAllUsers",
        "description": "Mengambil dan menampilkan daftar lengkap semua pengguna (users) yang terdaftar di platform. Gunakan fungsi ini jika diminta untuk 'list semua user', 'tampilkan pengguna', 'berikan data user', atau permintaan sejenisnya.",
        "parameters": {"type": "object", "properties": {}, "required": []},
        "strict": True,
    },
},
{
    "type": "function",
    "function": {
        "name": "jobRecommendation",
        "description": "Memberikan rekomendasi pekerjaan kepada user yang sedang login sesuai dengan user preferences dan skills. Otomatis menggunakan profil user yang sedang login.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "strict": True
    }
},


{
    "type": "function",
    "function": {
        "name": "find_talent",
        "description": "Rekomendasikan freelancer terbaik berdasarkan kategori pekerjaan (job tags). Gunakan fungsi ini jika user meminta untuk 'mencari talenta', 'menemukan freelancer', atau 'merekomendasikan kandidat' untuk bidang tertentu seperti 'Web Development' atau 'UI/UX Design'.",
        "parameters": {
            "type": "object",
            "properties": {
                "job_tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Daftar kategori (tags) pekerjaan untuk menemukan talenta yang cocok."
                },
                "top_n": {
                    "type": "integer",
                    "default": 3,
                    "minimum": 1,
                    "maximum": 10
                },
            },
            "required": ["job_tags"],
            "additionalProperties": False,
        },
        "strict": True,
    },
},
{
    "type": "function",
    "function": {
        "name": "proposal_template",
        "description": "Membuat template proposal yang dipersonalisasi untuk sebuah pekerjaan (job).",
        "parameters": {
            "type": "object",
            "properties": {
                "job_id": {"type": "string", "description": "ID dari pekerjaan yang akan dibuatkan proposal."},
                "profile": {
                    "type": "object",
                    "description": "Profil singkat freelancer (nama, skills, pencapaian).",
                    "properties": {
                        "name": {"type": "string"},
                        "skills": {"type": "array", "items": {"type": "string"}},
                        "achievements": {"type": "array", "items": {"type": "string"}},
                    },
                },
            },
            "required": ["job_id", "profile"],
        },
        "strict": True,
    },
},
{
    "type": "function",
    "function": {
        "name": "get_project_reminders",
        "description": "Dapatkan ringkasan status proyek dan pengingat untuk pengguna yang sedang login. Berguna untuk memeriksa pekerjaan yang sedang berjalan, submission yang tertunda, dan deadline yang mendekat. Tidak perlu mengirim user_id karena otomatis menggunakan user yang sedang login.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "strict": True,
    },
},
{
    "type": "function",
    "function": {
        "name": "get_financial_summary",
        "description": "Dapatkan ringkasan keuangan (pemasukan, pengeluaran, jumlah transaksi) untuk pengguna yang sedang login. Tidak perlu mengirim user_id karena otomatis menggunakan user yang sedang login.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "strict": True,
    },
},
]

# --------------------------
# Helper: fetch data via ICP HTTP
# --------------------------

async def _fetch_canister_data(ctx: Context, cache: Dict, endpoint: str, canister_id: str) -> List[Dict]:
    now = time.time()
    if cache["data"] is not None and (now - cache["ts"]) < _CACHE_TTL:
        return cache["data"]

    errors = []
    headers_with_host = with_host(HEADERS, canister_id)
    url = f"{BASE_URL}/{endpoint}"


    try:
        ctx.logger.debug(f"Trying POST request to {url}")
        resp = requests.post(url, headers=headers_with_host, json={}, timeout=15)
        ctx.logger.debug(f"POST response status: {resp.status_code}")
        ctx.logger.debug(f"POST response headers: {dict(resp.headers)}")
        resp.raise_for_status()

        # Log the raw response content for debugging
        ctx.logger.debug(f"Raw response from POST to {endpoint}: {resp.text}")

        # Check if response is HTML (error page) instead of JSON
        content_type = resp.headers.get('content-type', '').lower()
        if 'text/html' in content_type:
            ctx.logger.warning(f"Received HTML response instead of JSON from POST to {endpoint}")
            ctx.logger.warning(f"HTML content (first 200 chars): {resp.text[:200]}")
            errors.append(f"POST to {endpoint} returned HTML instead of JSON")
        else:
            # Log full response content before JSON parsing to debug malformed JSON
            ctx.logger.info(f"Full POST response content before JSON parsing: {resp.text}")
            ctx.logger.info(f"Response encoding: {resp.encoding}, apparent encoding: {resp.apparent_encoding}")
            try:
                data = resp.json()
                if isinstance(data, list):
                    ctx.logger.debug(f"Successfully fetched data via POST from {endpoint}. Data length: {len(data)}")
                    cache["data"] = data
                    cache["ts"] = time.time()
                    return data
                else:
                    ctx.logger.warning(f"POST to {endpoint} returned non-list data: {type(data)}")
                    errors.append(f"POST to {endpoint} returned non-list data")
            except json.JSONDecodeError as json_err:
                ctx.logger.error(f"JSON decode error for POST to {endpoint}: {json_err}")
                ctx.logger.error(f"Response text around error position: {resp.text[max(0, json_err.pos-50):json_err.pos+50]}")
                ctx.logger.error(f"Character at error position: {repr(resp.text[json_err.pos] if json_err.pos < len(resp.text) else 'EOF')}")

                # Log raw bytes around error position to check for hidden characters
                start_pos = max(0, json_err.pos - 20)
                end_pos = min(len(resp.text), json_err.pos + 20)
                raw_bytes = resp.text[start_pos:end_pos].encode('utf-8', errors='replace')
                ctx.logger.error(f"Raw bytes around error position: {raw_bytes}")
                ctx.logger.error(f"Hex dump around error: {[hex(b) for b in raw_bytes]}")

                # Try to identify the exact issue by checking JSON structure
                lines = resp.text[:json_err.pos].split('\n')
                ctx.logger.error(f"Line where error occurs: {lines[-1] if lines else 'N/A'}")
                ctx.logger.error(f"Total characters processed: {json_err.pos}/{len(resp.text)}")

                # Try manual JSON parsing as fallback
                try:
                    ctx.logger.info("Attempting manual JSON parsing...")
                    data = json.loads(resp.text)
                    if isinstance(data, list):
                        ctx.logger.info(f"Manual JSON parsing succeeded for POST to {endpoint}. Data length: {len(data)}")
                        cache["data"] = data
                        cache["ts"] = time.time()
                        return data
                    else:
                        ctx.logger.warning(f"Manual parsing: POST to {endpoint} returned non-list data: {type(data)}")
                        errors.append(f"POST to {endpoint} returned non-list data")
                except Exception as manual_err:
                    ctx.logger.error(f"Manual JSON parsing also failed: {manual_err}")
                    # Try JSON repair as last resort
                    try:
                        ctx.logger.info("Attempting JSON repair and parsing...")
                        original_json = resp.text
                        repaired_json = repair_json(original_json)
                        if repaired_json != original_json:
                            ctx.logger.info("JSON was repaired, attempting to parse...")
                            ctx.logger.debug(f"Original length: {len(original_json)}, Repaired length: {len(repaired_json)}")
                        else:
                            ctx.logger.info("No JSON repairs were needed")
                        data = json.loads(repaired_json)
                        if isinstance(data, list):
                            ctx.logger.info(f"JSON repair and parsing succeeded for POST to {endpoint}. Data length: {len(data)}")
                            cache["data"] = data
                            cache["ts"] = time.time()
                            return data
                        else:
                            ctx.logger.warning(f"Repaired JSON: POST to {endpoint} returned non-list data: {type(data)}")
                            errors.append(f"POST to {endpoint} returned non-list data")
                    except Exception as repair_err:
                        ctx.logger.error(f"JSON repair also failed: {repair_err}")
                        # Last resort: try to extract valid JSON objects manually
                        try:
                            ctx.logger.info("Attempting manual JSON object extraction...")
                            # Try to find all valid JSON objects in the response
                            import re

                            # More robust pattern to match JSON objects, handling nested structures
                            object_pattern = r'\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}'
                            matches = re.findall(object_pattern, resp.text)

                            ctx.logger.info(f"Found {len(matches)} potential JSON objects")

                            if matches:
                                valid_objects = []
                                for i, match in enumerate(matches):
                                    try:
                                        # Try to parse each object individually
                                        parsed_obj = json.loads(match)
                                        valid_objects.append(parsed_obj)
                                        ctx.logger.debug(f"Object {i} parsed successfully")
                                    except json.JSONDecodeError as obj_err:
                                        ctx.logger.warning(f"Object {i} failed parsing: {obj_err}")
                                        # Try to fix common issues in individual objects
                                        fixed_match = match
                                        # Remove trailing commas
                                        fixed_match = re.sub(r',(\s*})', r'\1', fixed_match)
                                        try:
                                            parsed_obj = json.loads(fixed_match)
                                            valid_objects.append(parsed_obj)
                                            ctx.logger.debug(f"Object {i} fixed and parsed successfully")
                                        except:
                                            ctx.logger.warning(f"Object {i} could not be fixed")

                                if valid_objects:
                                    ctx.logger.info(f"Successfully extracted {len(valid_objects)} valid objects")
                                    # Cache the valid data
                                    cache["data"] = valid_objects
                                    cache["ts"] = time.time()
                                    return valid_objects
                                else:
                                    ctx.logger.error("No valid objects could be extracted")
                            else:
                                ctx.logger.error("Manual extraction failed: could not find any JSON objects")
                        except Exception as extract_err:
                            ctx.logger.error(f"Manual extraction also failed: {extract_err}")

                        errors.append(f"POST to {endpoint} failed JSON parsing: {json_err}")
            except Exception as parse_err:
                ctx.logger.error(f"Unexpected error parsing POST response from {endpoint}: {parse_err}")
                errors.append(f"POST to {endpoint} failed parsing: {parse_err}")
    except requests.exceptions.RequestException as e:
        errors.append(f"POST to {endpoint} failed: {e}")
        ctx.logger.warning(f"POST request to {url} failed: {e}")
        # Log response details if available
        if 'resp' in locals():
            ctx.logger.warning(f"POST response status: {resp.status_code}")
            ctx.logger.warning(f"POST response content type: {resp.headers.get('content-type', 'unknown')}")
            ctx.logger.warning(f"POST response content (first 500 chars): {resp.text[:500]}")
    except json.JSONDecodeError as e:
        errors.append(f"Failed to decode JSON from POST to {endpoint}: {e}")
        ctx.logger.error(f"Failed to decode JSON from POST to {url}. Response text: {resp.text}", exc_info=True)
        # Additional logging for JSON decode errors
        ctx.logger.error(f"Response status: {resp.status_code}")
        ctx.logger.error(f"Response content-type: {resp.headers.get('content-type', 'unknown')}")
        ctx.logger.error(f"Response content length: {len(resp.text)}")
    except Exception as e:
        errors.append(f"POST to {endpoint} failed: {e}")
        ctx.logger.error(f"Unexpected error during POST to {url}: {e}", exc_info=True)

    # Fallback ke GET - but be more careful with ICP response verification issues
    try:
        ctx.logger.debug(f"Trying GET request to {url}")
        resp = requests.get(url, headers=headers_with_host, timeout=10)
        ctx.logger.debug(f"GET response status: {resp.status_code}")
        ctx.logger.debug(f"GET response headers: {dict(resp.headers)}")
        resp.raise_for_status()

        # Log the raw response content for debugging
        ctx.logger.debug(f"Raw response from GET to {endpoint}: {resp.text}")

        # Check if response is HTML (error page) instead of JSON
        content_type = resp.headers.get('content-type', '').lower()
        if 'text/html' in content_type:
            ctx.logger.warning(f"Received HTML response instead of JSON from GET to {endpoint}")
            ctx.logger.warning(f"HTML content (first 200 chars): {resp.text[:200]}")
            errors.append(f"GET to {endpoint} returned HTML instead of JSON")
        elif resp.status_code == 503:
            ctx.logger.warning(f"GET to {endpoint} returned 503 Service Unavailable")
            errors.append(f"GET to {endpoint} failed: 503 Service Unavailable")
        else:
            # Log full response content before JSON parsing to debug malformed JSON
            ctx.logger.info(f"Full GET response content before JSON parsing: {resp.text}")
            ctx.logger.info(f"Response encoding: {resp.encoding}, apparent encoding: {resp.apparent_encoding}")
            try:
                data = resp.json()
                if isinstance(data, list):
                    cache["data"] = data
                    cache["ts"] = time.time()
                    return data
                else:
                    ctx.logger.warning(f"GET to {endpoint} returned non-list data: {type(data)}")
                    errors.append(f"GET to {endpoint} returned non-list data")
            except json.JSONDecodeError as json_err:
                ctx.logger.error(f"JSON decode error for GET to {endpoint}: {json_err}")
                ctx.logger.error(f"Response text around error position: {resp.text[max(0, json_err.pos-50):json_err.pos+50]}")
                ctx.logger.error(f"Character at error position: {repr(resp.text[json_err.pos] if json_err.pos < len(resp.text) else 'EOF')}")

                # Log raw bytes around error position to check for hidden characters
                start_pos = max(0, json_err.pos - 20)
                end_pos = min(len(resp.text), json_err.pos + 20)
                raw_bytes = resp.text[start_pos:end_pos].encode('utf-8', errors='replace')
                ctx.logger.error(f"Raw bytes around error position: {raw_bytes}")
                ctx.logger.error(f"Hex dump around error: {[hex(b) for b in raw_bytes]}")

                # Try to identify the exact issue by checking JSON structure
                lines = resp.text[:json_err.pos].split('\n')
                ctx.logger.error(f"Line where error occurs: {lines[-1] if lines else 'N/A'}")
                ctx.logger.error(f"Total characters processed: {json_err.pos}/{len(resp.text)}")

                # Try manual JSON parsing as fallback
                try:
                    ctx.logger.info("Attempting manual JSON parsing...")
                    data = json.loads(resp.text)
                    if isinstance(data, list):
                        ctx.logger.info(f"Manual JSON parsing succeeded for GET to {endpoint}. Data length: {len(data)}")
                        cache["data"] = data
                        cache["ts"] = time.time()
                        return data
                    else:
                        ctx.logger.warning(f"Manual parsing: GET to {endpoint} returned non-list data: {type(data)}")
                        errors.append(f"GET to {endpoint} returned non-list data")
                except Exception as manual_err:
                    ctx.logger.error(f"Manual JSON parsing also failed: {manual_err}")
                    # Try JSON repair as last resort
                    try:
                        ctx.logger.info("Attempting JSON repair and parsing...")
                        original_json = resp.text
                        repaired_json = repair_json(original_json)
                        if repaired_json != original_json:
                            ctx.logger.info("JSON was repaired, attempting to parse...")
                            ctx.logger.debug(f"Original length: {len(original_json)}, Repaired length: {len(repaired_json)}")
                        else:
                            ctx.logger.info("No JSON repairs were needed")
                        data = json.loads(repaired_json)
                        if isinstance(data, list):
                            ctx.logger.info(f"JSON repair and parsing succeeded for GET to {endpoint}. Data length: {len(data)}")
                            cache["data"] = data
                            cache["ts"] = time.time()
                            return data
                        else:
                            ctx.logger.warning(f"Repaired JSON: GET to {endpoint} returned non-list data: {type(data)}")
                            errors.append(f"GET to {endpoint} returned non-list data")
                    except Exception as repair_err:
                        ctx.logger.error(f"JSON repair also failed: {repair_err}")
                        # Last resort: try to extract valid JSON objects manually
                        try:
                            ctx.logger.info("Attempting manual JSON object extraction...")
                            # Try to find all valid JSON objects in the response
                            import re

                            # More robust pattern to match JSON objects, handling nested structures
                            object_pattern = r'\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}'
                            matches = re.findall(object_pattern, resp.text)

                            ctx.logger.info(f"Found {len(matches)} potential JSON objects")

                            if matches:
                                valid_objects = []
                                for i, match in enumerate(matches):
                                    try:
                                        # Try to parse each object individually
                                        parsed_obj = json.loads(match)
                                        valid_objects.append(parsed_obj)
                                        ctx.logger.debug(f"Object {i} parsed successfully")
                                    except json.JSONDecodeError as obj_err:
                                        ctx.logger.warning(f"Object {i} failed parsing: {obj_err}")
                                        # Try to fix common issues in individual objects
                                        fixed_match = match
                                        # Remove trailing commas
                                        fixed_match = re.sub(r',(\s*})', r'\1', fixed_match)
                                        try:
                                            parsed_obj = json.loads(fixed_match)
                                            valid_objects.append(parsed_obj)
                                            ctx.logger.debug(f"Object {i} fixed and parsed successfully")
                                        except:
                                            ctx.logger.warning(f"Object {i} could not be fixed")

                                if valid_objects:
                                    ctx.logger.info(f"Successfully extracted {len(valid_objects)} valid objects")
                                    # Cache the valid data
                                    cache["data"] = valid_objects
                                    cache["ts"] = time.time()
                                    return valid_objects
                                else:
                                    ctx.logger.error("No valid objects could be extracted")
                            else:
                                ctx.logger.error("Manual extraction failed: could not find any JSON objects")
                        except Exception as extract_err:
                            ctx.logger.error(f"Manual extraction also failed: {extract_err}")

                        errors.append(f"GET to {endpoint} failed JSON parsing: {json_err}")
            except Exception as parse_err:
                ctx.logger.error(f"Unexpected error parsing GET response from {endpoint}: {parse_err}")
                errors.append(f"GET to {endpoint} failed parsing: {parse_err}")
    except requests.exceptions.RequestException as e:
        errors.append(f"GET to {endpoint} failed: {e}")
        ctx.logger.warning(f"GET request to {url} failed: {e}")
        # Log response details if available
        if 'resp' in locals():
            ctx.logger.warning(f"GET response status: {resp.status_code}")
            ctx.logger.warning(f"GET response content type: {resp.headers.get('content-type', 'unknown')}")
            ctx.logger.warning(f"GET response content (first 500 chars): {resp.text[:500]}")
    except json.JSONDecodeError as e:
        errors.append(f"Failed to decode JSON from GET to {endpoint}: {e}")
        ctx.logger.error(f"Failed to decode JSON from GET to {url}. Response text: {resp.text}", exc_info=True)
        # Additional logging for JSON decode errors
        ctx.logger.error(f"Response status: {resp.status_code}")
        ctx.logger.error(f"Response content-type: {resp.headers.get('content-type', 'unknown')}")
        ctx.logger.error(f"Response content length: {len(resp.text)}")
    except Exception as e:
        errors.append(f"GET to {endpoint} failed: {e}")
        ctx.logger.error(f"Unexpected error during GET to {url}: {e}", exc_info=True)

    # Provide more informative error message
    if any("returned HTML instead of JSON" in error for error in errors):
        raise RuntimeError(f"Failed to fetch from {endpoint}: ICP canister returned HTML error page instead of JSON. This is likely a response verification issue with GET requests to query methods. POST requests work correctly. Errors: " + " | ".join(errors))
    elif any("503 Service Unavailable" in error for error in errors):
        raise RuntimeError(f"Failed to fetch from {endpoint}: ICP canister returned 503 Service Unavailable. This indicates response verification issues with GET requests. POST requests work correctly. Errors: " + " | ".join(errors))
    else:
        raise RuntimeError(f"Failed to fetch from {endpoint}: " + " | ".join(errors))

async def fetch_jobs(ctx: Context) -> List[Dict[str, Any]]:
    return await _fetch_canister_data(ctx, _JOBS_CACHE, "getAllJobs", BACKEND_CANISTER_ID)

# BAGIAN 3: Fungsi fetch untuk users, sama seperti fetch_jobs
async def fetch_users(ctx: Context) -> List[Dict[str, Any]]:
    # Asumsi canister User punya endpoint /getAllUsers
    return await _fetch_canister_data(ctx, _USERS_CACHE, "getAllUsers", BACKEND_CANISTER_ID)

# --------------------------
# Helper functions for chat analysis
# --------------------------

def detect_languages(chat_history):
    """
    Detect languages used in chat history.
    Returns list of languages sorted by frequency.
    """
    # Simple language detection based on common words
    language_markers = {
        "English": ["the", "is", "and", "to", "of", "a", "in", "that", "have", "for"],
        "Indonesian": ["yang", "dan", "ini", "itu", "dengan", "untuk", "tidak", "akan", "pada", "saya"],
        "Spanish": ["el", "la", "de", "que", "y", "en", "un", "ser", "se", "no"],
        "French": ["le", "la", "de", "et", "un", "être", "que", "à", "avoir", "ne"]
    }
    
    # Count language markers in messages
    language_counts = {lang: 0 for lang in language_markers}
    
    for msg in chat_history:
        message = msg.get("message", "").lower()
        words = message.split()
        
        for lang, markers in language_markers.items():
            for word in words:
                if word in markers:
                    language_counts[lang] += 1
    
    # Sort languages by count
    sorted_languages = sorted(language_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Return languages that have at least one marker
    return [lang for lang, count in sorted_languages if count > 0]

def analyze_formality(chat_history):
    """
    Analyze formality level of conversation.
    Returns: "formal", "neutral", or "casual"
    """
    formal_markers = ["would", "could", "may", "kindly", "please", "thank you", "regards", "sincerely", "dear"]
    casual_markers = ["hey", "hi", "yeah", "cool", "sure", "ok", "lol", "haha", "btw", "gonna", "wanna"]
    
    formal_count = 0
    casual_count = 0
    
    for msg in chat_history:
        message = msg.get("message", "").lower()
        
        for marker in formal_markers:
            if marker in message:
                formal_count += 1
        
        for marker in casual_markers:
            if marker in message:
                casual_count += 1
    
    if formal_count > casual_count * 2:
        return "formal"
    elif casual_count > formal_count * 2:
        return "casual"
    else:
        return "neutral"

def extract_topics(chat_history):
    """
    Extract main topics from conversation.
    Returns list of topic keywords.
    """
    # Combine all messages
    all_text = " ".join([msg.get("message", "") for msg in chat_history])
    
    # Simple keyword extraction (could be improved with NLP)
    common_words = ["the", "and", "to", "of", "a", "in", "is", "that", "it", "for", 
                   "yang", "dan", "ini", "itu", "dengan", "untuk", "tidak", "akan"]
    
    words = all_text.lower().split()
    word_counts = Counter(words)
    
    # Filter out common words and short words
    topics = [word for word, count in word_counts.most_common(10) 
              if word not in common_words and len(word) > 3]
    
    return topics[:5]  # Return top 5 topics

def parse_suggestions(suggestions_text):
    """
    Parse suggestions from LLM response.
    Returns list of suggestion texts.
    """
    # Try to find numbered suggestions (1., 2., 3.)
    import re
    suggestions = []
    
    # Look for numbered patterns like "1.", "2.", "3."
    matches = re.findall(r'(?:\d+\.\s*)([^\n]+(?:\n(?!\d+\.).+)*)', suggestions_text)
    
    if matches and len(matches) >= 2:
        return matches[:3]  # Return up to 3 suggestions
    
    # Fallback: split by double newlines
    parts = suggestions_text.split('\n\n')
    if len(parts) >= 2:
        return parts[:3]
    
    # Last resort: just return the whole text as one suggestion
    return [suggestions_text]

# --------------------------
# TF-IDF functions for job recommendation
# --------------------------

def tokenize(text: str) -> List[str]:
    """Simple tokenization"""
    import re
    return re.findall(r'\b\w+\b', text.lower())

def build_doc(job: Dict[str, Any]) -> str:
    """Build document string from job"""
    parts = []
    parts.append(job.get("jobName", ""))
    parts.extend(job.get("jobDescription", []))
    for tag in (job.get("jobTags", []) or []):
        parts.append(tag.get("jobCategoryName", ""))
    parts.extend(job.get("jobRequirementSkills", []) or [])
    return " ".join(str(p) for p in parts)

def tf(tokens: List[str]) -> Dict[str, float]:
    """Term frequency"""
    counter = Counter(tokens)
    total = len(tokens)
    return {term: count / total for term, count in counter.items()}

def compute_idf(token_lists: List[List[str]]) -> Dict[str, float]:
    """Inverse document frequency"""
    n_docs = len(token_lists)
    if n_docs == 0:
        return {}
    
    df = defaultdict(int)
    for tokens in token_lists:
        for token in set(tokens):
            df[token] += 1
    
    return {term: math.log(n_docs / count) for term, count in df.items()}

def vec(tf_map: Dict[str, float], idf_map: Dict[str, float]) -> Dict[str, float]:
    """TF-IDF vector"""
    return {term: tf_val * idf_map.get(term, 0.0) for term, tf_val in tf_map.items()}

def cosine(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    """Cosine similarity"""
    dot = sum(v1.get(k, 0.0) * v2.get(k, 0.0) for k in set(v1.keys()) | set(v2.keys()))
    norm1 = math.sqrt(sum(v ** 2 for v in v1.values()))
    norm2 = math.sqrt(sum(v ** 2 for v in v2.values()))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)

# --------------------------
# Tool handlers (local compute)
# --------------------------

async def tool_chat_assistant(ctx: Context, args: Dict[str, Any]):
    """
    Generate context-aware message suggestions based on chat history.
    """
    ctx.logger.info(f"Processing chat_assistant request with args: {args}")
    
    chat_history = args.get("chat_history", [])
    current_draft = args.get("current_draft", "")
    user_id = args.get("user_id", "")
    recipient_id = args.get("recipient_id", "")
    job_context = args.get("job_context", None)
    assistance_type = args.get("assistance_type", "suggest_reply")
    source_language = args.get("source_language", "auto")
    target_language = args.get("target_language", "en")
    
    ctx.logger.info(f"Chat assistant processing for user {user_id}, recipient {recipient_id}")
    ctx.logger.info(f"Chat history length: {len(chat_history)}")
    
    try:
        # Get user data for context
        users_data = await fetch_users(ctx)
        user = next((u for u in users_data if u.get("id") == user_id), None)
        recipient = next((u for u in users_data if u.get("id") == recipient_id), None)
        
        # Build context for LLM
        context_builder = []
        
        # Add user roles
        if user and recipient and job_context:
            user_role = "client" if job_context.get("client_id") == user_id else "freelancer"
            recipient_role = "freelancer" if user_role == "client" else "client"
            context_builder.append(f"You are assisting {user.get('username', 'a user')} who is the {user_role}.")
            context_builder.append(f"They are talking to {recipient.get('username', 'another user')} who is the {recipient_role}.")
        
        # Add job context if available
        if job_context:
            context_builder.append(f"They are discussing a job: {job_context.get('job_name')}.")
            context_builder.append(f"The job status is {job_context.get('job_status')}.")
            if job_context.get('deadline'):
                context_builder.append(f"The deadline is {job_context.get('deadline')}.")
        
        # Analyze conversation patterns if we have chat history
        if chat_history:
            # Detect language used
            languages_used = detect_languages(chat_history)
            primary_language = languages_used[0] if languages_used else "English"
            
            # Detect formality level
            formality = analyze_formality(chat_history)
            
            # Detect topic clusters
            topics = extract_topics(chat_history)
            
            if languages_used:
                context_builder.append(f"The conversation is primarily in {primary_language}.")
            context_builder.append(f"The conversation tone is {formality}.")
            if topics:
                context_builder.append(f"Main topics discussed: {', '.join(topics)}.")
        
        # Build final context string
        context = "\n".join(context_builder)
        
        # Process based on assistance type
        if assistance_type == "suggest_reply":
            # Generate reply suggestions
            return await generate_reply_suggestions(ctx, chat_history, current_draft, user, recipient, context)
        elif assistance_type == "translate":
            # Handle translation
            return await translate_message(ctx, current_draft, source_language, target_language)
        elif assistance_type == "optimize_tone":
            # Optimize message tone
            return await optimize_message_tone(ctx, current_draft, formality)
        elif assistance_type == "explain_technical":
            # Explain technical terms
            return await explain_technical_terms(ctx, current_draft)
        elif assistance_type == "prevent_misunderstanding":
            # Prevent misunderstandings
            return await prevent_misunderstandings(ctx, current_draft, chat_history)
        else:
            ctx.logger.error(f"Unknown assistance type: {assistance_type}")
            return {"error": f"Unknown assistance type: {assistance_type}"}
    
    except Exception as e:
        ctx.logger.error(f"Error in chat_assistant: {e}", exc_info=True)
        return {"error": f"Error processing chat assistant request: {str(e)}"}

async def generate_reply_suggestions(ctx: Context, chat_history, current_draft, user, recipient, context):
    """
    Generate reply suggestions based on chat history and context.
    """
    ctx.logger.info("Generating reply suggestions")
    
    # Format chat history for LLM
    formatted_history = []
    for msg in chat_history[-10:]:  # Use last 10 messages for context
        sender_id = msg.get("sender_id", "")
        is_user = sender_id == user.get("id") if user else False
        role = "user" if is_user else "assistant"
        formatted_history.append({
            "role": role,
            "content": msg.get("message", "")
        })
    
    # System message with context
    system_message = {
        "role": "system",
        "content": f"""You are an AI assistant helping with communication between a freelancer and client.
{context}
Your task is to suggest helpful, professional, and contextually appropriate responses.
Generate 3 different response options with varying tones and approaches.
Keep suggestions concise, helpful, and professional.
IMPORTANT: Do NOT include labels, notes, or descriptions in your suggestions like "(Direct Approach)" or "(Formal Style)". 
Only include the actual message content that the user would send.
"""
    }
    
    # Add current draft if any
    if current_draft:
        formatted_history.append({
            "role": "user",
            "content": f"I'm drafting this message: {current_draft}"
        })
    
    # Add instruction for what we want
    formatted_history.append({
        "role": "user",
        "content": "Please suggest 3 different ways I could respond or complete my message. Vary the tone and approach. Make each suggestion brief and to the point. Do NOT include labels or descriptions in your suggestions."
    })
    
    # Call ASI1 API
    payload = {
        "model": "asi1-mini",
        "messages": [system_message] + formatted_history,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    
    try:
        ctx.logger.info("Calling ASI1 API for suggestions")
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        
        # Parse suggestions
        suggestions_text = resp["choices"][0]["message"]["content"]
        ctx.logger.info(f"Raw suggestions: {suggestions_text}")
        suggestions = parse_suggestions(suggestions_text)
        
        # Clean suggestions - remove any labels or notes in parentheses
        cleaned_suggestions = []
        for sugg in suggestions[:3]:
            # Remove patterns like "Option 1: ", "1. ", "(Direct Approach)", etc.
            cleaned = re.sub(r'^(Option \d+: |^\d+\.\s+)', '', sugg)
            cleaned = re.sub(r'\([^)]*\)\*?\*?', '', cleaned)  # Remove anything in parentheses
            cleaned = re.sub(r'\*\*[^*]*\*\*', '', cleaned)    # Remove anything in **bold**
            cleaned = cleaned.strip()
            cleaned_suggestions.append(cleaned)
        
        # Format for frontend with clean suggestions
        formatted_suggestions = []
        for i, sugg in enumerate(cleaned_suggestions):
            if not sugg:  # Skip empty suggestions
                continue
            preview = sugg.split("\n")[0][:30] + "..." if len(sugg) > 30 else sugg
            formatted_suggestions.append({
                "preview": f"Opsi {i+1}: {preview}",
                "text": sugg
            })
        
        ctx.logger.info(f"Generated {len(formatted_suggestions)} cleaned suggestions")
        return formatted_suggestions
    
    except Exception as e:
        ctx.logger.error(f"Error generating suggestions: {e}", exc_info=True)
        return [{"preview": "Error generating suggestions", "text": "Sorry, I couldn't generate suggestions at this time."}]

async def translate_message(ctx: Context, message, source_language, target_language):
    """
    Translate a message from source language to target language.
    """
    ctx.logger.info(f"Translating from {source_language} to {target_language}")
    
    system_message = {
        "role": "system",
        "content": f"You are a professional translator. Translate the following text from {source_language} to {target_language}. Maintain the tone and meaning of the original text."
    }
    
    user_message = {
        "role": "user",
        "content": message
    }
    
    # Call ASI1 API
    payload = {
        "model": "asi1-mini",
        "messages": [system_message, user_message],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    
    try:
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        
        translation = resp["choices"][0]["message"]["content"]
        
        return [{
            "preview": f"Translation to {target_language}",
            "text": translation.strip(),
            "original": message
        }]
    
    except Exception as e:
        ctx.logger.error(f"Error translating message: {e}", exc_info=True)
        return [{"preview": "Error translating", "text": "Sorry, I couldn't translate this message."}]

async def optimize_message_tone(ctx: Context, message, target_tone):
    """
    Optimize message tone (formal, neutral, casual).
    """
    ctx.logger.info(f"Optimizing message tone to {target_tone}")
    
    system_message = {
        "role": "system",
        "content": f"You are a communication expert. Rewrite the following message to make it more {target_tone} in tone. Maintain the core message and meaning."
    }
    
    user_message = {
        "role": "user",
        "content": message
    }
    
    # Call ASI1 API
    payload = {
        "model": "asi1-mini",
        "messages": [system_message, user_message],
        "temperature": 0.5,
        "max_tokens": 1024,
    }
    
    try:
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        
        optimized = resp["choices"][0]["message"]["content"]
        
        return [{
            "preview": f"{target_tone.capitalize()} version",
            "text": optimized.strip(),
            "original": message
        }]
    
    except Exception as e:
        ctx.logger.error(f"Error optimizing message tone: {e}", exc_info=True)
        return [{"preview": "Error optimizing tone", "text": "Sorry, I couldn't optimize this message."}]

async def explain_technical_terms(ctx: Context, message):
    """
    Identify and explain technical terms in a message.
    """
    ctx.logger.info("Explaining technical terms")
    
    system_message = {
        "role": "system",
        "content": "You are a technical expert. Identify technical terms in the following message and provide simple explanations for each term. Format your response as a JSON object with term as key and explanation as value."
    }
    
    user_message = {
        "role": "user",
        "content": message
    }
    
    # Call ASI1 API
    payload = {
        "model": "asi1-mini",
        "messages": [system_message, user_message],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    
    try:
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        
        explanation_text = resp["choices"][0]["message"]["content"]
        
        # Try to parse JSON response
        try:
            import json
            explanations = json.loads(explanation_text)
            
            # Format for frontend
            result = {
                "message": message,
                "explanations": explanations
            }
            
            return result
        except:
            # Fallback if not valid JSON
            return {
                "message": message,
                "explanation": explanation_text
            }
    
    except Exception as e:
        ctx.logger.error(f"Error explaining technical terms: {e}", exc_info=True)
        return {"error": "Sorry, I couldn't explain the technical terms."}

async def prevent_misunderstandings(ctx: Context, message, chat_history):
    """
    Identify potential misunderstandings in a message.
    """
    ctx.logger.info("Checking for potential misunderstandings")
    
    # Get last few messages for context
    recent_history = chat_history[-5:] if chat_history else []
    history_text = "\n".join([f"Message: {msg.get('message', '')}" for msg in recent_history])
    
    system_message = {
        "role": "system",
        "content": "You are a communication expert. Review the draft message in the context of the conversation history and identify any potential misunderstandings, ambiguities, or phrases that could be interpreted negatively. Suggest clearer alternatives."
    }
    
    user_message = {
        "role": "user",
        "content": f"Conversation history:\n{history_text}\n\nDraft message:\n{message}"
    }
    
    # Call ASI1 API
    payload = {
        "model": "asi1-mini",
        "messages": [system_message, user_message],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    
    try:
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        
        analysis = resp["choices"][0]["message"]["content"]
        
        return {
            "message": message,
            "analysis": analysis
        }
    
    except Exception as e:
        ctx.logger.error(f"Error preventing misunderstandings: {e}", exc_info=True)
        return {"error": "Sorry, I couldn't analyze for potential misunderstandings."}

async def tool_getAllJobs(ctx: Context, args: Dict[str, Any]):
    jobs = await fetch_jobs(ctx)

    # Limit to latest 20 jobs for performance and UX
    limited_jobs = jobs[-20:] if len(jobs) > 20 else jobs

    # Sort by creation date (newest first) - assuming jobs have timestamp
    # For now, just return limited results
    result = {
        "jobs": limited_jobs,
        "total_count": len(jobs),
        "shown_count": len(limited_jobs),
        "message": f"Menampilkan {len(limited_jobs)} pekerjaan terbaru dari {len(jobs)} total pekerjaan yang tersedia."
    }

    return result

# BAGIAN 4: Handler untuk tool 'getAllUsers' - DENGAN LIMITASI PRIVASI
async def tool_getAllUsers(ctx: Context, args: Dict[str, Any]):
    users = await fetch_users(ctx)

    # PRIVACY PROTECTION: Only show limited public information
    # Don't expose sensitive data like emails, full profiles, etc.
    safe_users = []
    for user in users[:10]:  # Limit to first 10 users only
        safe_user = {
            "id": user.get("id"),
            "username": user.get("username", "Anonymous"),
            "profilePictureUrl": user.get("profilePictureUrl"),
            "isProfileCompleted": user.get("isProfileCompleted", False),
            # DON'T expose: email, wallet, phone, full profile details
        }
        safe_users.append(safe_user)

    result = {
        "users": safe_users,
        "total_count": len(users),
        "shown_count": len(safe_users),
        "message": f"Menampilkan {len(safe_users)} pengguna dari {len(users)} total pengguna. Data sensitif disembunyikan untuk privasi.",
        "privacy_note": "Untuk alasan privasi, hanya informasi publik yang ditampilkan."
    }

    return result

async def tool_recommend_jobs_by_skills(ctx: Context, args: Dict[str, Any]):
    skills: List[str] = args.get("skills", [])
    top_n: int = int(args.get("top_n", 5))
    jobs = await fetch_jobs(ctx)

    # Build corpus
    docs = [build_doc(j) for j in jobs]
    tokens_list = [tokenize(d) for d in docs]
    idf_map = compute_idf(tokens_list + [tokenize(" ".join(skills))])
    job_vecs = [vec(tf(toks), idf_map) for toks in tokens_list]

    # Query vector from skills
    q_tokens = tokenize(" ".join(skills))
    q_vec = vec(tf(q_tokens), idf_map)

    scored = []
    for j, v in zip(jobs, job_vecs):
        score = cosine(q_vec, v)
        scored.append({"job": j, "score": round(float(score), 4)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]

async def tool_budget_advice(ctx: Context, args: Dict[str, Any]):
    scope: str = args.get("scope", "")
    tags: List[str] = args.get("tags", [])
    slots = args.get("slots", None)
    jobs = await fetch_jobs(ctx)

    # Filter comparables
    def has_overlap(job):
        if not tags:
            return True
        job_tags = {t.get("jobCategoryName", "").lower() for t in (job.get("jobTags", []) or [])}
        return any(tag.lower() in job_tags for tag in tags)

    comps = [j for j in jobs if has_overlap(j)] or jobs

    salaries = [float(j.get("jobSalary", 0.0)) for j in comps if isinstance(j.get("jobSalary", None), (int, float))]
    salaries = [s for s in salaries if s > 0]
    if not salaries:
        return {"advice": None, "reason": "No comparable salaries found"}

    salaries.sort()
    n = len(salaries)
    median = salaries[n // 2] if n % 2 == 1 else 0.5 * (salaries[n // 2 - 1] + salaries[n // 2])
    q1 = salaries[n // 4]
    q3 = salaries[(3 * n) // 4]
    iqr = max(q3 - q1, 1.0)

    # base range
    low = max(0.0, median - 0.5 * iqr)
    high = median + 0.5 * iqr

    # complexity factor from scope keywords
    scope_tokens = set(tokenize(scope))
    heavy = {"integration", "optimization", "scalable", "realtime", "security", "ml", "ai", "distributed"}
    light = {"bugfix", "minor", "landing", "static", "copywriting"}

    factor = 1.0
    if scope_tokens & heavy:
        factor *= 1.2
    if scope_tokens & light:
        factor *= 0.9
    
    # slots adjustment (linear)
    if isinstance(slots, int) and slots > 0:
        avg_slots = sum(int(j.get("jobSlots", 1)) for j in comps if isinstance(j.get("jobSlots", None), (int, float)))
        cnt_slots = sum(1 for j in comps if isinstance(j.get("jobSlots", None), (int, float))) or 1
        avg_slots = max(1.0, avg_slots / cnt_slots)
        factor *= max(0.5, min(2.0, slots / avg_slots))

    return {
        "median": round(median, 2),
        "range": {"low": round(low * factor, 2), "high": round(high * factor, 2)},
        "samples": n,
        "tags_used": tags,
        "notes": "Heuristic estimate using median±0.5*IQR, adjusted by scope keywords and slots.",
    }

async def tool_proposal_template(ctx: Context, args: Dict[str, Any]):
    job_id: str = args.get("job_id")
    profile: Dict[str, Any] = args.get("profile", {}) or {}
    jobs = await fetch_jobs(ctx)
    job = next((j for j in jobs if j.get("id") == job_id), None)
    if not job:
        return {"error": f"Job {job_id} not found"}

    job_name = job.get("jobName", "")
    tags = ", ".join([t.get("jobCategoryName", "") for t in (job.get("jobTags", []) or [])])
    desc_points = [d for d in (job.get("jobDescription", []) or []) if isinstance(d, str)]
    salary = job.get("jobSalary", None)

    p_name = profile.get("name", "")
    p_skills = profile.get("skills", []) or []
    p_ach = profile.get("achievements", []) or []

    template = {
        "title": f"Proposal for {job_name}",
        "introduction": f"Hello{(' ' + p_name) if p_name else ''}, I’d love to help with {job_name}. I have experience in {', '.join(p_skills) if p_skills else 'relevant areas'}.",
        "understanding": "Key points from your brief:",
        "scope_breakdown": desc_points[:6],
        "approach": [
            "Clarify success metrics and constraints",
            "Design and plan the solution with milestones",
            "Implement iteratively with regular check-ins",
            "Testing and quality assurance",
            "Handover and documentation",
        ],
        "deliverables": [
            "Clear milestone plan",
            "Working solution matching requirements",
            "Documentation and basic training",
        ],
        "timeline": "Estimated 1–4 weeks depending on final scope",
        "budget_hint": f"Target budget around {salary} (adjustable)" if isinstance(salary, (int, float)) else "Budget to be discussed based on scope",
        "why_me": ("Highlights: " + "; ".join(p_ach)) if p_ach else "I focus on clarity, reliability, and timely delivery.",
        "tags": tags,
    }
    return template

async def tool_find_talent(ctx: Context, args: Dict[str, Any]):
    job_tags: List[str] = args.get("job_tags", [])
    ctx.logger.info(f"Fetching data for talent search for job_tags='{job_tags}'")

    # 1. Fetch all necessary data
    users = await fetch_users(ctx)
    ctx.logger.info(f"Fetched {len(users)} users.")

    # 2. Create a virtual target job from the provided tags
    # Ini memungkinkan LLM untuk memproses permintaan tanpa memerlukan job_id yang ada
    target_job = {
        "jobName": f"Pekerjaan dengan kategori: {', '.join(job_tags)}",
        "jobTags": [{"jobCategoryName": tag} for tag in job_tags],
        "jobDescription": [f"Mencari talenta yang ahli dalam bidang {', '.join(job_tags)}."],
        # Tambahkan field lain jika diperlukan untuk pemrosesan LLM
    }
    
    # 3. Filter users who have completed their profile
    active_users = [u for u in users if u.get("isProfileCompleted")]
    ctx.logger.info(f"Found {len(active_users)} active users with completed profiles.")

    # 4. PRIVACY PROTECTION: Limit and sanitize user data
    limited_candidates = active_users[:15]  # Limit to top 15 candidates
    safe_candidates = []
    for user in limited_candidates:
        safe_candidate = {
            "id": user.get("id"),
            "username": user.get("username", "Anonymous"),
            "profilePictureUrl": user.get("profilePictureUrl"),
            "isProfileCompleted": user.get("isProfileCompleted", False),
            # DON'T expose sensitive data
        }
        safe_candidates.append(safe_candidate)

    # 5. Return sanitized data for the LLM to process
    return {
        "target_job": target_job,
        "potential_candidates": safe_candidates,
        "total_candidates": len(active_users),
        "shown_candidates": len(safe_candidates),
        "message": f"Ditemukan {len(active_users)} kandidat potensial. Menampilkan {len(safe_candidates)} kandidat teratas.",
        "privacy_note": "Data kandidat dibatasi untuk alasan privasi."
    }

async def tool_get_project_reminders(ctx: Context, args: Dict[str, Any]):
    # Get user_id from args first, then fallback to context
    user_id = args.get("user_id") or getattr(ctx, 'user_id', None)
    if not user_id:
        return {"error": "User not logged in. Please login to access project reminders."}
    
    jobs = await fetch_jobs(ctx)
    
    ongoing_jobs = [j for j in jobs if j.get("userId") == user_id and j.get("jobStatus") == "Ongoing"]
    pending_submissions = [j for j in jobs if j.get("userId") == user_id and j.get("jobStatus") == "Submitted"] # Assuming "Submitted" status
    
    now = int(time.time() * 1_000_000_000)
    three_days_in_ns = 3 * 24 * 60 * 60 * 1_000_000_000
    
    near_deadline_jobs = [
        j["jobName"] for j in ongoing_jobs 
        if "jobDeadline" in j and (int(j["jobDeadline"]) - now) < three_days_in_ns
    ]

    return {
        "ongoingJobs": len(ongoing_jobs),
        "pendingSubmissions": len(pending_submissions),
        "jobsNearDeadline": near_deadline_jobs
    }

async def tool_get_financial_summary(ctx: Context, args: Dict[str, Any]):
    # Get user_id from args first, then fallback to context
    user_id = args.get("user_id") or getattr(ctx, 'user_id', None)
    if not user_id:
        return {"error": "User not logged in. Please login to access financial summary."}

    users = await fetch_users(ctx)
    user = next((u for u in users if u.get("id") == user_id), None)

    if not user:
        return {"error": "User not found"}

    # This is a simplification. A real implementation would need to fetch transactions.
    # We will simulate this based on the user's wallet value.
    return {
        "totalIncome": user.get("wallet", 0.0),
        "totalExpense": 0.0, # Cannot be calculated from user data
        "transactionCount": 0 # Cannot be calculated from user data
    }

async def tool_jobRecommendation(ctx: Context, args: Dict[str, Any]):
    # Get user_id from context
    user_id = getattr(ctx, 'user_id', None)
    if not user_id:
        return {"error": "User not logged in. Please login to get personalized job recommendations."}
    
    # Fetch user data and jobs
    users = await fetch_users(ctx)
    jobs = await fetch_jobs(ctx)
    
    # Find current user
    current_user = next((u for u in users if u.get("id") == user_id), None)
    if not current_user:
        return {"error": "User profile not found."}
    
    # Get user preferences (skills/categories)
    user_preferences = current_user.get("preference", [])
    if not user_preferences:
        return {
            "message": "Untuk mendapatkan rekomendasi pekerjaan yang lebih baik, silakan lengkapi preferensi skill Anda di profil.",
            "available_jobs_count": len([j for j in jobs if j.get("jobStatus") == "Open"]),
            "recommendations": []
        }
    
    # Extract skill names from preferences
    user_skills = [pref.get("jobCategoryName", "") for pref in user_preferences if pref.get("jobCategoryName")]
    ctx.logger.info(f"User skills from preferences: {user_skills}")
    
    # Filter open jobs and score them based on matching skills
    open_jobs = [j for j in jobs if j.get("jobStatus") == "Open"]
    scored_jobs = []
    
    for job in open_jobs:
        job_tags = job.get("jobTags", []) or []
        job_categories = [tag.get("jobCategoryName", "").lower() for tag in job_tags if tag.get("jobCategoryName")]
        
        # Calculate skill match score
        skill_matches = 0
        for skill in user_skills:
            if skill.lower() in job_categories:
                skill_matches += 1
        
        match_percentage = (skill_matches / len(user_skills)) * 100 if user_skills else 0
        
        if skill_matches > 0:  # Only include jobs with at least one skill match
            scored_jobs.append({
                "job": job,
                "skill_matches": skill_matches,
                "match_percentage": round(match_percentage, 1),
                "matching_skills": [skill for skill in user_skills if skill.lower() in job_categories]
            })
    
    # Sort by skill matches (descending) and then by salary (descending)
    scored_jobs.sort(key=lambda x: (x["skill_matches"], x["job"]["jobSalary"]), reverse=True)
    
    # Return top 5 recommendations
    top_recommendations = scored_jobs[:5]
    
    return {
        "user_skills": user_skills,
        "total_matching_jobs": len(scored_jobs),
        "recommendations": top_recommendations,
        "message": f"Ditemukan {len(scored_jobs)} pekerjaan yang cocok dengan skill Anda: {', '.join(user_skills)}"
    }


# --------------------------
# Dispatcher untuk tool calls dari ASI1
# --------------------------

async def execute_tool(func_name: str, arguments: dict, ctx: Context):
    # Log eksekusi tool
    ctx.logger.info(f"Executing tool '{func_name}' with arguments: {arguments}")
    
    if func_name == "chat_assistant":
        return await tool_chat_assistant(ctx, arguments)
    if func_name == "getAllJobs":
        return await tool_getAllJobs(ctx, arguments)
    # BAGIAN 5: Dispatcher untuk 'getAllUsers', sama seperti 'getAllJobs'
    if func_name == "getAllUsers":
        return await tool_getAllUsers(ctx, arguments)
    if func_name == "recommend_jobs_by_skills":
        return await tool_recommend_jobs_by_skills(ctx, arguments)
    if func_name == "budget_advice":
        return await tool_budget_advice(ctx, arguments)
    if func_name == "proposal_template":
        return await tool_proposal_template(ctx, arguments)
    if func_name == "find_talent":
        return await tool_find_talent(ctx, arguments)
    if func_name == "get_project_reminders":
        return await tool_get_project_reminders(ctx, arguments)
    if func_name == "get_financial_summary":
        return await tool_get_financial_summary(ctx, arguments)
    if func_name == "jobRecommendation":
        return await tool_jobRecommendation(ctx, arguments)
    
    ctx.logger.error(f"Unsupported function call: {func_name}")
    raise ValueError(f"Unsupported function call: {func_name}")

# --------------------------
# Orkestrasi: sama pola dengan agent.py
# --------------------------

async def process_query(query: str, ctx: Context, user_id: str = None) -> str:
    ctx.logger.info(f"--- Starting new query processing for: '{query}' ---")
    # Store user_id in context for tools to access
    ctx.user_id = user_id
    ctx.logger.info(f"User ID from session: {user_id}")
    try:
        # Check if this is a chat_assistant request
        try:
            data = json.loads(query)
            if isinstance(data, dict) and data.get("action") == "chat_assistant":
                ctx.logger.info(f"Detected chat_assistant request, processing directly")
                result = await tool_chat_assistant(ctx, data)
                return json.dumps(result)
        except:
            # Not a JSON or not a chat_assistant request, continue with normal flow
            pass
            
        system_message = {
            "role": "system",
            "content": "Anda adalah AI Freelance Assistant yang HARUS menggunakan tools yang tersedia. WAJIB gunakan tools untuk: 1) financial summary - panggil get_financial_summary, 2) project reminders - panggil get_project_reminders, 3) job recommendations - panggil jobRecommendation, 4) mencari jobs - panggil getAllJobs, 5) mencari talenta - panggil find_talent, 6) chat assistant - panggil chat_assistant. SELALU panggil tool yang sesuai dengan permintaan user!"
        }
        initial_message = {"role": "user", "content": query}
        payload = {
            "model": "asi1-mini",
            "messages": [system_message, initial_message],
            "tools": tools,
            "temperature": 0.5,
            "max_tokens": 1024,
        }
        
        ctx.logger.info("-> Step 1: Sending query to LLM to determine tool calls...")
        r = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=payload)
        r.raise_for_status()
        resp = r.json()
        ctx.logger.debug(f"LLM initial response: {resp}")


        tool_calls = resp["choices"][0]["message"].get("tool_calls", [])
        history = [system_message, initial_message, resp["choices"][0]["message"]]

        if not tool_calls:
            ctx.logger.warning("LLM did not request any tool calls. Returning direct response or a default message.")
            direct_response = resp["choices"][0]["message"].get("content")
            return direct_response or "Tidak ada fungsi yang perlu dijalankan. Tolong jelaskan kebutuhan Anda (skills, scope, atau ID job)."
        
        ctx.logger.info(f"-> Step 2: LLM requested {len(tool_calls)} tool call(s). Executing them...")
        for call in tool_calls:
            func_name = call["function"]["name"]
            arguments = json.loads(call["function"]["arguments"]) if call["function"].get("arguments") else {}
            call_id = call["id"]

            try:
                # 'execute_tool' sudah memiliki logging di dalamnya
                result = await execute_tool(func_name, arguments, ctx)
                content = json.dumps(result)
                ctx.logger.debug(f"Result for tool '{func_name}' (truncated): {content[:250]}...")
            except Exception as e:
                ctx.logger.error(f"Tool execution for '{func_name}' failed: {e}")
                content = json.dumps({"error": f"Tool execution failed: {e}"})

            history.append({"role": "tool", "tool_call_id": call_id, "content": content})

        final_payload = {
            "model": "asi1-mini",
            "messages": history,
            "temperature": 0.6,
            "max_tokens": 1024,
        }
        
        ctx.logger.info("-> Step 3: Sending tool results back to LLM for final answer...")
        rf = requests.post(f"{ASI1_BASE_URL}/chat/completions", headers=ASI1_HEADERS, json=final_payload)
        rf.raise_for_status()
        final = rf.json()
        
        final_answer = final["choices"][0]["message"]["content"]
        ctx.logger.info(f"-> Step 4: Final answer received from LLM.")
        ctx.logger.debug(f" {final_answer}")
        return final_answer
        
    except Exception as e:
        ctx.logger.error(f"An error occurred during process_query: {e}", exc_info=True)
        return f"Terjadi kesalahan: {e}"

# --------------------------
# uAgents bootstrap
# --------------------------

agent = Agent(name='advisor-agent', port=8002, mailbox="efb08343-de5c-4a29-8a62-2535c43734a9")
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    try:
        ack = ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id)
        await ctx.send(sender, ack)

        for item in msg.content:
            if isinstance(item, StartSessionContent):
                ctx.logger.info(f"Start session from {sender}")
                continue
            elif isinstance(item, TextContent):
                ctx.logger.info(f"Received message from {sender}: {item.text}")
                reply = await process_query(item.text, ctx)
                response = ChatMessage(timestamp=datetime.now(timezone.utc), msg_id=uuid4(), content=[TextContent(type="text", text=reply)])
                await ctx.send(sender, response)
            else:
                ctx.logger.info(f"Unexpected content from {sender}")
    except Exception as e:
        ctx.logger.error(f"handle_chat_message error: {e}", exc_info=True)
        err = ChatMessage(timestamp=datetime.now(timezone.utc), msg_id=uuid4(), content=[TextContent(type="text", text=f"Error: {e}")])
        await ctx.send(sender, err)

@chat_proto.on_message(model=ChatAcknowledgement)
async def handle_chat_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack from {sender} for {msg.acknowledged_msg_id}")

@agent.on_rest_post("/api/chat", ChatRequest, ChatResponse)
async def handle_chat_rest(ctx: Context, req: ChatRequest) -> ChatResponse:
    """
    REST endpoint untuk menerima chat dari frontend
    POST http://localhost:8002/api/chat
    Body: {"message": "your message here", "userId": "optional_user_id"}
    """
    try:
        ctx.logger.info(f"Received REST chat request: {req.message}")
        ctx.logger.info(f"User ID from request: {req.userId}")
        
        # Gunakan fungsi process_query yang sudah ada dengan user_id
        response = await process_query(req.message, ctx, req.userId)
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="success"
        )
    except Exception as e:
        ctx.logger.error(f"Error processing REST chat request: {e}")
        return ChatResponse(
            response=f"Terjadi kesalahan: {str(e)}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="error"
        )

@agent.on_rest_get("/api/health", HealthResponse)
async def handle_health_check(ctx: Context) -> Dict[str, Any]:
    """
    Health check endpoint
    GET http://localhost:8002/api/health
    """
    return {
        "status": "healthy",
        "agent_name": agent.name,
        "agent_address": ctx.agent.address,
        "port": 8002
    }

@agent.on_rest_get("/api/jobs", JobsResponse)
async def handle_get_jobs(ctx: Context) -> JobsResponse:
    """
    REST endpoint untuk mendapatkan semua jobs
    GET http://localhost:8002/api/jobs
    """
    try:
        jobs = await fetch_jobs(ctx)
        return JobsResponse(
            jobs=jobs,
            count=len(jobs),
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="success"
        )
    except Exception as e:
        return JobsResponse(
            jobs=[],
            count=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            status=f"error: {str(e)}"
        )

# Tambahkan CORS headers jika diperlukan (optional)
async def setup_cors(ctx: Context):
    """Setup CORS jika diperlukan untuk frontend"""
    ctx.logger.info("Agent started with REST endpoints:")
    ctx.logger.info("  POST /api/chat - Chat dengan agent")
    ctx.logger.info("  GET /api/health - Health check")
    ctx.logger.info("  GET /api/jobs - Dapatkan semua jobs")
    ctx.logger.info(f"  Server running on http://localhost:8002")



agent.include(chat_proto)
agent._on_startup.append(setup_cors)

if __name__ == "__main__":
    agent.run()