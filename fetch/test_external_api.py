#!/usr/bin/env python3
"""
Test script untuk menguji akses API eksternal advisor_agent
"""
import requests
import json
import time

def test_external_api():
    """Test akses API eksternal"""
    base_url = "http://34.122.202.222:8002"

    print("🧪 Testing External API Access")
    print(f"📡 Target: {base_url}")
    print("-" * 50)

    # Test 1: Health Check
    print("\n1️⃣  Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Agent: {data.get('agent_name', 'Unknown')}")
            print(f"   Status: {data.get('status', 'Unknown')}")
            print(f"   Port: {data.get('port', 'Unknown')}")
        else:
            print(f"❌ Health check failed: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

    # Test 2: Chat API
    print("\n2️⃣  Testing Chat API...")
    try:
        payload = {
            "message": "Hello, can you help me find React jobs?",
            "userId": "test-user-123"
        }
        response = requests.post(
            f"{base_url}/api/chat",
            json=payload,
            timeout=30,
            headers={'Content-Type': 'application/json'}
        )
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data.get('response', '')[:100]}...")
            print(f"   Status: {data.get('status', 'Unknown')}")
        else:
            print(f"❌ Chat API failed: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Chat API error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

    # Test 3: Jobs API
    print("\n3️⃣  Testing Jobs API...")
    try:
        response = requests.get(f"{base_url}/api/jobs", timeout=15)
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Jobs count: {data.get('count', 0)}")
            print(f"   Status: {data.get('status', 'Unknown')}")
        else:
            print(f"❌ Jobs API failed: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Jobs API error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

    print("\n" + "=" * 50)
    print("🎯 External API Testing Complete!")
    print("💡 Jika ada error, pastikan:")
    print("   - Server sudah running di port 8002")
    print("   - Port 8002 sudah di-forward ke public IP")
    print("   - Firewall mengizinkan koneksi ke port 8002")
    print("   - SSL certificate sudah dikonfigurasi dengan benar")

if __name__ == "__main__":
    test_external_api()
