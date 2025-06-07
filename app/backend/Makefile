build:
	docker build -t brovy/pandak8s-backend:latest .

push:
	docker push brovy/pandak8s-backend:latest

run-local:
	docker run \
	  -v $$HOME/.kube:/root/.kube:ro \
	  -e KUBECONFIG=/root/.kube/config \
	  -p 8080:8080 \
	  test_backend:latest