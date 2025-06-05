build:
	docker build -t test_frontend:latest --build-arg VITE_API_BASE_URL=http://localhost:8080/api .

run-local:
	docker run \
	  -p 8000:80 \
	  -e BACKEND_HOST=localhost:8080/api \
	  test_frontend:latest