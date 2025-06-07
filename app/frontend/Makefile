build:
	docker build -t brovy/pandak8s-frontend:latest .

push:
	docker push brovy/pandak8s-frontend:latest

run-local:
	docker run \
	  -p 8000:80 \
	  -e BACKEND_HOST=localhost:8080 \
	  test_frontend:latest