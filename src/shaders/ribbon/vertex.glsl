#pragma glslify: noise3d = require(../partials/perlin3d.glsl)

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normal;
  vec3 pos = position;
  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
  modelPosition.z += noise3d(vec3(modelPosition.x, 1.0, modelPosition.y)) * 0.5;
  
  vec4 viewPosition = viewMatrix * modelPosition;
  vPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}