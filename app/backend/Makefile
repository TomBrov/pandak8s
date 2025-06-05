build:
	docker build -t test_backend:latest .

run-local:
	docker run \
	  -v $$HOME/.kube:/root/.kube:ro \
	  -e KUBECONFIG=/root/.kube/config \
	  -p 8000:8080 \
	  test_backend:latest