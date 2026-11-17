from functools import wraps
from flask import Blueprint, request, jsonify, Response
from utils.data import sample_dataset, parse_csv, analyze
from services import ml

api = Blueprint("api", __name__)


def safe(fn):
    @wraps(fn)
    def w(*a, **k):
        try:
            return fn(*a, **k)
        except ValueError as e:
            return jsonify(error=str(e)), 400
    return w


def body():
    d = request.get_json(silent=True)
    if not d or not d.get("rows"):
        raise ValueError("No dataset provided.")
    return d


@api.get("/health")
def health():
    return jsonify(status="ok")


@api.get("/dataset/sample")
def sample():
    df = sample_dataset()
    if request.args.get("format") == "csv":
        return Response(df.to_csv(index=False), mimetype="text/csv",
                        headers={"Content-Disposition": "attachment; filename=sample_customers.csv"})
    return jsonify(analyze(df))


@api.post("/dataset/upload")
@safe
def upload():
    f = request.files.get("file")
    if not f or not f.filename.lower().endswith(".csv"):
        raise ValueError("Please upload a .csv file.")
    return jsonify(parse_csv(f.read()))


def post(path, name, fn):
    api.add_url_rule(path, name, safe(lambda: jsonify(fn(body()))), methods=["POST"])


post("/clustering/kmeans", "kmeans", lambda d: ml.cluster("kmeans", d))
post("/clustering/gmm", "gmm", lambda d: ml.cluster("gmm", d))
post("/clustering/compare", "compare", ml.compare)
post("/clustering/elbow", "elbow", ml.elbow)
post("/clustering/hierarchical", "hier", ml.hierarchical)
post("/dimensionality/pca", "pca", ml.pca)
post("/dimensionality/factor-analysis", "fa", ml.factor)
post("/evaluation", "evaluation", ml.evaluate)
