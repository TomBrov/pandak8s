build-local:
	docker build -t test_frontend:1.1.0 --build-arg VITE_API_BASE_URL=http://localhost:8080 .

build-prod:
	docker build -t brovy/test_frontend:2.0.0 .

push-prod:
	docker push brovy/test_frontend:2.0.0

run-local:
	docker run \
	  -p 8000:80 \
	  -e BACKEND_HOST=localhost:8080 \
	  test_frontend:latest