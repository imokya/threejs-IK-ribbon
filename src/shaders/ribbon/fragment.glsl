uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
 vec3 lightPos = vec3(0, 2, 2);
 vec3 lightDir = normalize(vPosition - lightPos);
 vec3 col = uColor;
 col.xyz += clamp(dot(lightDir, vNormal), 0.0, 1.0) * 0.2;
gl_FragColor = vec4(col, 1.0);
}