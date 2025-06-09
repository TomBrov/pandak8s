TAG ?= latest

build:
	docker build -t brovy/pandak8s-frontend:$(TAG) .

push:
	docker push brovy/pandak8s-frontend:$(TAG)

run-local:
	docker run \
	  -p 8900:80 \
	  -e BACKEND_HOST=localhost:8080 \
	  brovy/pandak8s-frontend:$(TAG)

build-ci:
	docker build -t $(REGISTRY)/$(PRODUCT)-$(SERVICE):$(TAG) .


push-ci:
	docker push $(REGISTRY)/$(PRODUCT)-$(SERVICE):$(TAG)
