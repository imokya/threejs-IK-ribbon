import Env from './env'
import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'



class Bone {

  constructor(size) {
    this.center = new THREE.Vector3()
    this.size = size
    this.points = []
  }

  add(point) {
    this.points.push(point)
  }

  set(target) {
    this.center.copy(target)
    for(let i = 0; i < this.points.length; i++) {
      const point = this.points[i]
      const newPos = this.center.clone().add(point.dir.clone().multiplyScalar(point.dis))
      point.x = newPos.x
      point.y = newPos.y
      point.z = newPos.z
    }
  }

  follow(bone) {
    const dir = this.center.clone().sub(bone.center).normalize().multiplyScalar(this.size)
    const target = bone.center.clone().add(dir)
    this.set(target)
  }

}


export default class Ribbon {

  constructor() {
    this.env = new Env()
    this.scene = this.env.scene
    this.camera = this.env.camera
    this.target = new THREE.Vector3()
    this.angle = 0
    this.mouse = new THREE.Vector2()
    this.init()
  }

  init() {
    this.params = {
      width: 3,
      height: 30,
      widthSegments: 10,
      heightSegments: 200
    }

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setLights()
    this.addEvents()
  }

  setLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)

    this.scene.add(ambientLight)

    const light1 = new THREE.PointLight(0xffffff, 5, 10, 10)
    light1.position.set(0, 2, 2)
    this.scene.add(light1)

    const light2 = new THREE.PointLight(0xffffff, 5, 5, 3)
    light2.position.set(5, -2, -1)
    this.scene.add(light2)

    const helper1 = new THREE.PointLightHelper(light1)
    //this.scene.add(helper1)

    const helper2 = new THREE.PointLightHelper(light2)
    //this.scene.add(helper2)
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
    this.bones[0].set(target)
    for(let i = 0; i < this.bones.length-1; i++) {
      this.bones[i+1].follow(this.bones[i])
    }

  }

  updateGeometry() {
    this.geometry.attributes.position.needsUpdate = true
    for(let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i]
      for(let j = 0; j < bone.points.length; j++) {
        const point = bone.points[j]
        this.positions[point.index * 3 + 0] = point.x 
        this.positions[point.index * 3 + 1] = point.y
        this.positions[point.index * 3 + 2] = point.z 
      }
    }
    this.geometry.computeVertexNormals()
    this.geometry.normalizeNormals()

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
      let x, y, z
      for(let j = 0; j < this.params.widthSegments + 1; j++) {
        const index = i * (this.params.widthSegments + 1) + j
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
      bone.center.set(0, y, z)
      this.bones.push(bone)
    }

    this.positions = positions

  }

  setMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      wireframe: true,
      side: THREE.DoubleSide,
      color: 0xf8e2b3
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
    this.helper = new VertexNormalsHelper(this.mesh, 2, 0x00ff00, 1)
    //this.scene.add(this.helper)
  }

  update() {
    if(this.target) {
      this.follow(this.target)
      this.updateGeometry()
    }
  }

}