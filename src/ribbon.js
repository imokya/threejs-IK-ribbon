import Env from './env'
import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'

import vertexShader from './shaders/ribbon/vertex.glsl'
import fragmentShader from './shaders/ribbon/fragment.glsl'
import { UniformsLib } from 'three/src/renderers/shaders/UniformsLib'


class Bone {

  constructor(size) {
    this.center = new THREE.Vector3()
    this.size = size
    this.points = []
    this.axeDir = new THREE.Vector3()
  }

  add(point) {
    this.points.push(point)
  }

  set(target) {
    this.center.copy(target)
    for(let i = 0; i < this.points.length; i++) {
      const point = this.points[i]
      const newPos = this.center.clone().add(point.dir.clone().multiplyScalar(point.dis))
      const normal = this.axeDir.clone().negate().cross(this.direction)
      point.pos = newPos
      point.normal = normal
    }
  }

  follow(bone) {
    const dir = this.center.clone().sub(bone.center).normalize()
    const dis = dir.clone().multiplyScalar(this.size)
    const target = bone.center.clone().add(dis)
    this.direction = dir.clone()
    this.set(target)
  }

}


export default class Ribbon {

  constructor() {
    this.env = new Env()
    this.scene = this.env.scene
    this.camera = this.env.camera
    this.renderer = this.env.renderer
    this.target = new THREE.Vector3()
    this.angle = 0
    this.mouse = new THREE.Vector2()
    this.init()
  }

  init() {
    this.params = {
      width: 3,
      height: 30,
      widthSegments: 5,
      heightSegments: 100
    }

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setLights()
    this.addEvents()
  }

  setLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)

    this.scene.add(ambientLight)

    const light1 = new THREE.DirectionalLight(0xffffff, 0.3)
    light1.position.set(0, 2, 2)
    this.scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5)
    light2.position.set(5, -2, -1)
    this.scene.add(light2)
  }

  addEvents() {
    document.addEventListener('mousemove', e => {
      e.preventDefault()
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = - (e.clientY / window.innerHeight) * 2 + 1
      const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5)
      vector.unproject(this.camera)
      const dir = vector.sub(this.camera.position ).normalize()
      const distance = -this.camera.position.z / dir.z
      this.target = this.camera.position.clone().add(dir.multiplyScalar(distance))
    })
  }


  follow(target) {
    const dir = this.bones[0].center.clone().sub(target).normalize()
    this.bones[0].direction = dir
    this.bones[0].set(target)
    for(let i = 0; i < this.bones.length-1; i++) {
      this.bones[i+1].follow(this.bones[i])
    }

  }

  updateGeometry() {

    const normals = new Float32Array(this.positions.length)
    this.geometry.attributes.position.needsUpdate = true
    for(let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i]
      for(let j = 0; j < bone.points.length; j++) {
        const point = bone.points[j]
        this.positions[point.index * 3 + 0] = point.pos.x
        this.positions[point.index * 3 + 1] = point.pos.y
        this.positions[point.index * 3 + 2] = point.pos.z
        normals[point.index * 3 + 0] = point.normal.x 
        normals[point.index * 3 + 1] = point.normal.y
        normals[point.index * 3 + 2] = point.normal.z
      }
    }

    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    this.geometry.attributes.normal.needsUpdate = true

  }

  setGeometry() {
    this.geometry = new THREE.PlaneGeometry(
      this.params.width,
      this.params.height,
      this.params.widthSegments,
      this.params.heightSegments
    )

    const positions = this.geometry.attributes.position.array

    for(let i = 0; i < positions.length; i+=3) {
      let x = positions[i+0]
      let y = positions[i+1]
      let z = positions[i+2]
      y -= this.params.height / 2
      //positions[i+1] = y
    }

    this.geometry.attributes.position.needsUpdate = true

    this.bones = []

    for(let i = 0; i < this.params.heightSegments + 1; i++) {
      const bone = new Bone(this.params.height/this.params.heightSegments)
      let x, y, z, index
      for(let j = 0; j < this.params.widthSegments + 1; j++) {
        index = i * (this.params.widthSegments + 1) + j
        x = positions[index * 3 + 0]
        y = positions[index * 3 + 1]
        z = positions[index * 3 + 2]
        const point = new THREE.Vector3(x, y, z)
        const center = new THREE.Vector3(0, y, z)
        point.dir = point.clone().sub(center).normalize()
        point.dis = point.distanceTo(center)
        point.index = index
        bone.add(point)
      }
      bone.axeDir = bone.points[0].clone().sub(bone.points[1]).normalize()
      bone.center.set(0, y, z)
      this.bones.push(bone)
    }
    this.positions = positions

    // this.dirHelper = new THREE.ArrowHelper()
    // this.dirHelper.setColor(0xff0000)
    // this.dirHelper.setLength(10)
    // this.scene.add(this.dirHelper)

    // this.dirHelper1 = new THREE.ArrowHelper()
    // this.scene.add(this.dirHelper1)

    // this.dirHelper2 = new THREE.ArrowHelper()
    // this.scene.add(this.dirHelper2)

  }

  setMaterial() {
    // this.material = new THREE.MeshPhongMaterial({
    //   wireframe: false,
    //   side: THREE.FrontSide,
    //   color: 0xf8e2b3
    // })

    // const geo = new THREE.PlaneGeometry(10, 10, 2, 2)
    // const mat = new THREE.MeshBasicMaterial({
    //   color: new THREE.Color(0xe0e8dc),
    //   map: new THREE.TextureLoader().load('textures/ribbon.jpg'),
    //   normalMap: new THREE.TextureLoader().load('texture/normalmap.jpg')
    // })
    // const m = new THREE.Mesh(geo, mat)
    // this.scene.add(m)

    const normalMap = new THREE.TextureLoader().load('textures/normalmap.jpg', e=> {
      this.material.uniforms.normalMap.value = normalMap
      this.material.uniforms.normalScale.value.x = 2
      this.material.uniforms.normalScale.value.y = 2
    })
    normalMap.wrapS = THREE.RepeatWrapping
    normalMap.wrapT = THREE.RepeatWrapping

    const map = new THREE.TextureLoader().load('textures/ribbon.jpg', e=> {
      this.material.uniforms.map.value = map
    })
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(2, 2)

    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.envmap,
        UniformsLib.lightmap,
        UniformsLib.lights,
        UniformsLib.fog,
        UniformsLib.normalmap,
        {
          
          uColor: {
            value: new THREE.Color(0xe0e8dc)
          },

          roughness: {
            value: 1
          },

          emissive: {
            value: new THREE.Color(0x000000)
          },

          emissiveMap: {
            value: null
          },

          metalness: {
            value: 0
          },

          normalMap: {
            value: normalMap
          },

          roughnessMap: {
            value: normalMap
          },

          map: {
            value: map
          },

          normalScale: {
            value: {
              x: 2,
              y: 2
            }
          }
        }
      ]),
      defines: {
        STANDARD: '',
        USE_NORMALMAP: '',
        TANGENTSPACE_NORMALMAP: '',
        USE_UV: '',
        USE_MAP: '',
        USE_COLOR: ''
      },
      extensions: {
        derivatives: true,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false
      },
      side: THREE.DoubleSide,
      wireframe: false,
      lights: true,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: true

    })
   
    
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    this.mesh.matrixAutoUpdate = false
    this.mesh.frustumCulled = false
    // this.helper = new VertexNormalsHelper(this.mesh, 2, 0x00ff00, 1)
    // this.scene.add(this.helper)
  }

  update() {
    if(this.target) {
      this.follow(this.target)
      this.updateGeometry()
      
      // console.log('point0' , this.bones[1].points[0].dir)
      // console.log('point1' , this.bones[1].points[1].dir)
      // this.dirHelper.setDirection(this.bones[1].points[0].normal)
      // this.dirHelper.position.copy(this.bones[1].center)

      // this.dirHelper1.setDirection(this.bones[1].points[0].dir)
      // this.dirHelper1.position.copy(this.bones[1].center)

      // this.dirHelper2.setDirection(this.bones[1].direction)
      // this.dirHelper2.position.copy(this.bones[1].center)
    }
    //this.helper.update()
  }
 

}


