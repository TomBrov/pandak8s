PROJECT="frontend"
RUN_NUMBER=${1-"0"}
SHORT_SHA=${2-"dev"}
HOST_IP=${3-"localhost"}
ENVIRONMENT=${4-"Development"}
SHARED_TOKEN=${5-"NULL"}
JUPITER_REPOSITORY=${6}

VITE_WS_URL=wss://$HOST_IP
VITE_WEBRTC_URL=https://$HOST_IP/webrtc/
VITE_BASE_URL=https://$HOST_IP/api
VITE_WEBRTC_STREAMING=$HOST_IP

docker build --no-cache \
  -f dockerfiles/prod/${PROJECT}.dockerfile \
  -t ${JUPITER_REPOSITORY}/jupiter-ecs-${PROJECT}:"${RUN_NUMBER}" \
  -t ${JUPITER_REPOSITORY}/jupiter-ecs-${PROJECT}:"${SHORT_SHA}" \
  -t ${JUPITER_REPOSITORY}/jupiter-ecs-${PROJECT}:"${RUN_NUMBER}"-"${SHORT_SHA}" \
  --build-arg="SHARED_TOKEN=${SHARED_TOKEN}" \
  --build-arg="VITE_WS_URL=${VITE_WS_URL}" \
  --build-arg="VITE_WEBRTC_URL=${VITE_WEBRTC_URL}" \
  --build-arg="VITE_BASE_URL=${VITE_BASE_URL}" \
  --build-arg="VITE_WEBRTC_STREAMING=${VITE_WEBRTC_STREAMING}" .
