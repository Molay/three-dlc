import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  RGBFormat,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget
} from 'three';
import CopyShader from '../shaders/CopyShader';
import Pass from './Pass';

/**
 * @author alteredq / http://alteredqualia.com/
 */

const SavePass = function ( renderTarget ) {

	Pass.call( this );

	if ( CopyShader === undefined )
		console.error( "SavePass relies on CopyShader" );

	var shader = CopyShader;

	this.textureID = "tDiffuse";

	this.uniforms = UniformsUtils.clone( shader.uniforms );

	this.material = new ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.renderTarget = renderTarget;

	if ( this.renderTarget === undefined ) {

		this.renderTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat, stencilBuffer: false } );
		this.renderTarget.texture.name = "SavePass.rt";

	}

	this.needsSwap = false;

	this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new Scene();

	this.quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

SavePass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: SavePass,

	render: function ( renderer, writeBuffer, readBuffer ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer.texture;

		}

		this.quad.material = this.material;

		renderer.render( this.scene, this.camera, this.renderTarget, this.clear );

	}

} );


export default SavePass;
