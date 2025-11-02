# Plan: Implement the Talent Finder AI Agent

This plan outlines the steps to create the "Talent Finder" agent by adding a new tool to the existing `fetch/advisor_agent.py`.

### 1. Define the `talent_finder` Tool

- **Description**: Recommends the best freelancers for a specific job based on skill match and historical ratings.
- **Parameters**:
  - `job_id` (string, required): The ID of the job to find talent for.
  - `top_n` (integer, optional): The number of freelancers to recommend (default: 3).
- **Logic**:
  1. Fetch the target job's details using the `job_id`.
  2. Fetch all users (potential freelancers) from the `User` canister.
  3. Fetch all ratings from the `Rating` canister.
  4. Calculate an average rating for each user.
  5. Calculate a skill match score for each user against the target job (reusing the existing TF-IDF logic).
  6. Combine the skill score and rating score into a final recommendation score.
  7. Return the top N freelancers based on the final score.

### 2. Add New Canister Interaction Functions

- Create helper functions to fetch all users and all ratings from their respective canisters, similar to the existing `fetch_jobs` function. These will also include a simple cache.

### 3. Integrate the New Tool

- Add the `talent_finder` function definition to the `tools` list in `fetch/advisor_agent.py`.
- Add a new case in the `execute_tool` function to handle calls to `talent_finder`.

### 4. Test

- The agent will be ready for testing with queries like:
  - "Find the best freelancers for job '123'"
  - "Recommend 5 developers for job '456'"