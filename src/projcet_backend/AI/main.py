# import numpy as np
# import pandas as pd
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.neighbors import NearestNeighbors

# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "https://localhost:3000"}})

# @app.route('/getRecommendation', methods=['POST'])
# def getRecomendationListJob():
#     if not request.is_json:
#         return jsonify({"error": "Request must be JSON"}), 415

#     data = request.get_json()
#     features = data.get('jobTags')
#     list_jobs = data.get('listJobs')
#     list_user_clickeds = data.get('listUserClickeds')

#     user_clicks = pd.DataFrame(list_user_clickeds)
#     jobs = pd.DataFrame(list_jobs)

#     required_cols = {'userId', 'jobId', 'counter'}
#     if not required_cols.issubset(user_clicks.columns):
#         return jsonify({"error": "Missing required columns in user clicks data"}), 400

#     user_clicks['counter'] = pd.to_numeric(user_clicks['counter'], errors='coerce')

#     current_user_id = user_clicks['userId'].iloc[0]
#     user_clicked_jobs = set(user_clicks[user_clicks['userId'] == current_user_id]['jobId'])

#     jobs['features'] = jobs['jobTags'].apply(
#         lambda x: ' '.join([tag['jobCategoryName'] for tag in x])
#     )

#     vectorizer = TfidfVectorizer()
#     job_feature_matrix = vectorizer.fit_transform(jobs['features'])

#     nn = NearestNeighbors(metric='cosine', algorithm='brute')
#     nn.fit(job_feature_matrix)

#     def recommend_jobs(user_clicked_jobs, top_n=5):
#         clicked_indices = jobs[jobs['id'].isin(user_clicked_jobs)].index.tolist()
#         if not clicked_indices:
#             return []

#         distances, indices = nn.kneighbors(job_feature_matrix[clicked_indices], n_neighbors=top_n + len(clicked_indices))

#         all_indices = set(indices.flatten()) - set(clicked_indices)
#         recommended_jobs = jobs.iloc[list(all_indices)].head(top_n).to_dict(orient='records')
#         return recommended_jobs

#     recommendations = recommend_jobs(user_clicked_jobs)

#     return jsonify({
#         "message": "Success",
#         "top_jobs": recommendations
#     })


import faiss
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://localhost:3000"}})

@app.route('/getRecommendation', methods=['POST'])
def getRecomendationListJob():
    jobs = [
        {"id": 1, "title": "Frontend Developer", "category": ["Design","IT"]},
        {"id": 2, "title": "Backend Developer", "category": ["Management","IT"]},
        {"id": 3, "title": "Data Scientist", "category": ["IT"]},
        {"id": 4, "title": "Graphic Designer", "category": ["Management","Design", "IT"]},
        {"id": 5, "title": "UI/UX Designer", "category": ["Design"]},
    ]

    if len(jobs) == 0:
        return {"error": "No jobs available for recommendation"}, 400

    documents = [" ".join(job["category"]) for job in jobs]

    vectorizer = TfidfVectorizer()
    job_vectors = vectorizer.fit_transform(documents).toarray().astype("float32")

    d = job_vectors.shape[1]  
    index = faiss.IndexFlatL2(d)
    index.add(job_vectors)

    print(f"Total jobs in index: {index.ntotal}")

    query_job_id = 1  
    query_vector = job_vectors[query_job_id - 1].reshape(1, -1)

    k = len(jobs)  
    distances, indices = index.search(query_vector, k)

    recommendations = []
    for i, idx in enumerate(indices[0]):
        if idx == -1 or idx + 1 == query_job_id:  
            continue
        if distances[0][i] < 1.5:
            recommendations.append({
                "id": jobs[idx]["id"],
                "title": jobs[idx]["title"],
                "category": jobs[idx]["category"],
                "distance": float(distances[0][i])
            })

    if len(recommendations) == 0:
        return {"error": "no similar jobs found"}, 400
    
    return {
        "query_job": jobs[query_job_id - 1],
        "recommendations": recommendations
    }

if __name__ == '__main__':
    app.run(port=5001, debug=True, use_reloader=True)