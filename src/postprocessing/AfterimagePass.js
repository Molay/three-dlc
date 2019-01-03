import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneBufferGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget
} from 'three';
import AfterimageShader from '../shaders/AfterimageShader';
import Pass from './Pass';

/**
 * @author HypnosNova / https://www.threejs.org.cn/gallery/
 */

const AfterimagePass = function ( damp ) {

	Pass.call( this );

	if ( AfterimageShader === undefined )
		console.error( "AfterimagePass relies on AfterimageShader" );

	this.shader = AfterimageShader;

	this.uniforms = UniformsUtils.clone( this.shader.uniforms );

	this.uniforms[ "damp" ].value = damp !== undefined ? damp : 0.96;

	this.textureComp = new WebGLRenderTarget( window.innerWidth, window.innerHeight, {

		minFilter: LinearFilter,
		magFilter: NearestFilter,
		format: RGBAFormat

	} );

	this.textureOld = new WebGLRenderTarget( window.innerWidth, window.innerHeight, {

		minFilter: LinearFilter,
		magFilter: NearestFilter,
		format: RGBAFormat

	} );

	this.shaderMaterial = new ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: this.shader.vertexShader,
		fragmentShader: this.shader.fragmentShader

	} );

	this.sceneComp = new Scene();
	this.scene = new Scene();

	this.camera = new OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	this.camera.position.z = 1;

	var geometry = new PlaneBufferGeometry( 2, 2 );

	this.quadComp = new Mesh( geometry, this.shaderMaterial );
	this.sceneComp.add( this.quadComp );

	var material = new MeshBasicMaterial( { 
		map: this.textureComp.texture
	} );

	var quadScreen = new Mesh( geometry, material );
	this.scene.add( quadScreen );

};

AfterimagePass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: AfterimagePass,

	render: function ( renderer, writeBuffer, readBuffer ) {

		this.uniforms[ "tOld" ].value = this.textureOld.texture;
		this.uniforms[ "tNew" ].value = readBuffer.texture;

		this.quadComp.material = this.shaderMaterial;

		renderer.render( this.sceneComp, this.camera, this.textureComp );
		renderer.render( this.scene, this.camera, this.textureOld );
		
		if ( this.renderToScreen ) {
			
			renderer.render( this.scene, this.camera );
			
		} else {
			
			renderer.render( this.scene, this.camera, writeBuffer, this.clear );
			
		}

	}

} );


export default AfterimagePass;
