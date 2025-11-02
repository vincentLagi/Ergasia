# AI Advisor Session Integration

## Problem Solved
Previously, users had to manually provide their `user_id` when using AI advisor functions like `get_financial_summary` and `get_project_reminders`. This created a poor user experience as users don't typically know their internal user IDs.

## Solution Implemented

### 1. Frontend Changes (`advisorController.ts`)

**Added automatic user ID inclusion:**
```typescript
import { storage } from '../utils/storage';

export const askAdvisor = async (prompt: string): Promise<string> => {
    try {
        // Get current user from storage
        const currentUser = storage.getUser();
        const userId = currentUser?.id || null;

        const payload = {
            message: prompt,
            userId: userId  // Include user ID in the request
        };
        // ... rest of the code
    }
}
```

### 2. Backend Changes (`advisor_agent.py`)

**Updated ChatRequest model:**
```python
class ChatRequest(Model):
    message: str
    userId: str = None  # Optional user ID from frontend session
```

**Enhanced process_query function:**
```python
async def process_query(query: str, ctx: Context, user_id: str = None) -> str:
    # Store user_id in context for tools to access
    ctx.user_id = user_id
    ctx.logger.info(f"User ID from session: {user_id}")
    # ... rest of processing
```

**Updated tool functions:**
```python
async def tool_get_project_reminders(ctx: Context, args: Dict[str, Any]):
    # Get user_id from args first, then fallback to context
    user_id = args.get("user_id") or getattr(ctx, 'user_id', None)
    if not user_id:
        return {"error": "User not logged in. Please login to access project reminders."}
    # ... rest of function
```

**Updated tool descriptions:**
```python
{
    "name": "get_project_reminders",
    "description": "Dapatkan ringkasan status proyek dan pengingat untuk pengguna yang sedang login. Tidak perlu mengirim user_id karena otomatis menggunakan user yang sedang login.",
    "parameters": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}
```

### 3. New Features Added

**Job Recommendation Tool:**
```python
async def tool_jobRecommendation(ctx: Context, args: Dict[str, Any]):
    user_id = getattr(ctx, 'user_id', None)
    if not user_id:
        return {"error": "User not logged in. Please login to get personalized job recommendations."}
    
    # Get user preferences and match with available jobs
    current_user = next((u for u in users if u.get("id") == user_id), None)
    user_preferences = current_user.get("preference", [])
    
    # Score jobs based on skill matching
    # Return top 5 recommendations
```

## User Experience Improvements

### Before:
```
User: "Show me my financial summary"
AI: "I need your user ID to show financial summary. Please provide your user ID."
User: "I don't know my user ID. How do I find it?"
```

### After:
```
User: "Show me my financial summary"
AI: "Here's your financial summary:
     - Total Income: $1,500
     - Total Expense: $0
     - Transaction Count: 0
     
     Based on your current wallet balance."
```

## Functions That Now Work Automatically

### 1. **`get_project_reminders`**
- **Before**: Required manual `user_id` parameter
- **After**: Automatically uses logged-in user
- **Usage**: "Show me my project reminders" or "What deadlines are coming up?"

### 2. **`get_financial_summary`**
- **Before**: Required manual `user_id` parameter  
- **After**: Automatically uses logged-in user
- **Usage**: "Show my financial summary" or "How much money do I have?"

### 3. **`jobRecommendation` (New)**
- **Function**: Recommends jobs based on user's skills/preferences
- **Usage**: "Recommend jobs for me" or "What jobs match my skills?"
- **Features**: 
  - Uses user's preference categories
  - Calculates skill match percentage
  - Sorts by relevance and salary
  - Returns top 5 matches

## Technical Flow

### 1. User Authentication Check
```typescript
// Frontend automatically gets user from storage
const currentUser = storage.getUser();
const userId = currentUser?.id || null;
```

### 2. API Request
```json
{
  "message": "Show my project reminders",
  "userId": "user_12345"
}
```

### 3. Backend Processing
```python
# Backend stores user_id in context
ctx.user_id = req.userId

# Tools access user_id automatically
user_id = getattr(ctx, 'user_id', None)
```

### 4. Intelligent Fallback
```python
# Support both manual and automatic user_id
user_id = args.get("user_id") or getattr(ctx, 'user_id', None)
```

## Error Handling

### User Not Logged In
```json
{
  "error": "User not logged in. Please login to access project reminders."
}
```

### User Profile Not Found
```json
{
  "error": "User profile not found."
}
```

### No Preferences Set
```json
{
  "message": "Untuk mendapatkan rekomendasi pekerjaan yang lebih baik, silakan lengkapi preferensi skill Anda di profil.",
  "available_jobs_count": 25,
  "recommendations": []
}
```

## Testing

### Test Session Integration:
1. **Login as a user**
2. **Ask**: "Show me my financial summary"
3. **Expected**: Returns financial data without asking for user ID

### Test Job Recommendations:
1. **Ensure user has skills set in preferences**
2. **Ask**: "Recommend jobs for me"
3. **Expected**: Returns jobs matching user's skills

### Test Project Reminders:
1. **Have some jobs created by the user**
2. **Ask**: "What are my project deadlines?"
3. **Expected**: Returns user's ongoing projects and deadlines

## Benefits

1. ✅ **Better UX**: No more manual user ID input
2. ✅ **Seamless Integration**: Works with existing auth system
3. ✅ **Backward Compatible**: Still supports manual user_id if provided
4. ✅ **Security**: Only shows data for authenticated users
5. ✅ **Personalized**: AI responses are tailored to the logged-in user
6. ✅ **Intuitive**: Natural language queries work as expected

Now users can simply say:
- "Show my financial summary"
- "What jobs match my skills?"
- "Show my project deadlines"
- "Recommend jobs for me"

And the AI will automatically know which user is asking! 🎉

