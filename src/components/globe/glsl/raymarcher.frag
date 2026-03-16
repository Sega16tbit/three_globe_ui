precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_heightTex;
uniform sampler2D u_colorTex;
uniform float u_radius;
uniform float u_dispStrength;
uniform float u_cameraZoom;
uniform mat4 u_cameraWorldMatrix;
uniform mat4 u_cameraProjectionMatrixInverse;
uniform float u_orthoHalfHeight;
uniform float u_orthoHalfWidth;
uniform mat4 u_modelMatrix;
uniform mat4 u_inverseModelMatrix;
varying vec3 vWorldPos;
vec3 u_lightPos = vec3(1., 2., 3.);

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001

const float PI = 3.14159265359;

vec2 sphereUV(vec3 p) {
  // p in object space
  vec3 n = normalize(p);
  // swap axes so poles match texture meridian
  float u = 0.5 + atan(n.y, n.x) / (2.0 * PI); // lon
  float v = 0.5 - asin(n.z) / PI;             // lat
  // texture flip and horizontal rotation
  v = 1.0 - v;
  u = fract(u + 0.0);
  return vec2(u, v);
}

float sphereDisplaced(vec3 p) {
  float d = length(p) - u_radius;
  vec2 uv = sphereUV(p);
  float h = texture2D(u_heightTex, uv).r;
  d -= h * u_dispStrength;
  return d;
}

vec3 sphereColor(vec3 p) {
  vec2 uv = sphereUV(p);
  return texture2D(u_colorTex, uv).rgb;
}

float RayMarch(vec3 ro, vec3 rd) {
  float dO = 0.0;
  for(int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * dO;
    float dS = sphereDisplaced(p);
    dO += dS;
    if(abs(dS) < SURF_DIST || dO > MAX_DIST)
      break;
  }
  return dO;
}

vec3 GetNormal(vec3 p) {
  float e = 0.001;
  vec2 h = vec2(e, 0.0);
  return normalize(vec3(sphereDisplaced(p + h.xyy) - sphereDisplaced(p - h.xyy), sphereDisplaced(p + h.yxy) - sphereDisplaced(p - h.yxy), sphereDisplaced(p + h.yyx) - sphereDisplaced(p - h.yyx)));
}

void getCameraRay(out vec3 ro, out vec3 rd) {
  vec2 ndc = ((gl_FragCoord.xy + 0.5) / u_resolution) * 2.0 - 1.0;
  // clip space position on near plane
  vec4 clip = vec4(ndc, -1.0, 1.0);
  // convert to view space
  vec4 view = u_cameraProjectionMatrixInverse * clip;
  // orthographic cameras ignore perspective divide
  vec3 posView = view.xyz;
  // world position of that pixel
  ro = (u_cameraWorldMatrix * vec4(posView, 1.0)).xyz;
  // direction is constant
  rd = normalize(-u_cameraWorldMatrix[2].xyz);
}

void main() {
  vec3 ro;
  vec3 rd;

  getCameraRay(ro, rd);

  vec3 ro_obj = (u_inverseModelMatrix * vec4(ro, 1.0)).xyz;
  vec3 rd_obj = normalize((u_inverseModelMatrix * vec4(rd, 0.0)).xyz);

  float d = RayMarch(ro_obj, rd_obj);

  vec3 col = vec3(0.0);

  if(d < MAX_DIST) {
    vec3 p = ro_obj + rd_obj * d;
    vec3 n = GetNormal(p);

    // convert world light to object space
    vec3 lightPosObj = (u_inverseModelMatrix * vec4(u_lightPos, 1.0)).xyz;
    vec3 lightDir = normalize(lightPosObj - p);

    float diff = clamp(dot(n, lightDir), 0.0, 1.0);
    float ambient = 0.15;

    vec3 tex = sphereColor(p);
    col = tex * (diff + ambient);

  }

  // vec3 n = normalize(vWorldPos);
  // float u = 0.5 + atan(n.x, n.z) / (2.0 * PI);
  // float v = 0.5 - asin(n.y) / PI;
  // v = 1.0 - v;
  // u = fract(u + 0.75);
  // vec2 uv = vec2(u, v);
  // vec3 baseColor = texture2D(u_colorTex, uv).xyz;

  gl_FragColor = vec4(col, 1.0);
}
