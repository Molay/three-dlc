import { Mesh, OrthographicCamera, PlaneBufferGeometry, Scene, ShaderMaterial, UniformsUtils } from 'three';
import FilmShader from '../shaders/FilmShader';
import Pass from './Pass';

/**
 * @author alteredq / http://alteredqualia.com/
 */

const FilmPass = function ( noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale ) {

	Pass.call( this );

	if ( FilmShader === undefined )
		console.error( "FilmPass relies on FilmShader" );

	var shader = FilmShader;

	this.uniforms = UniformsUtils.clone( shader.uniforms );

	this.material = new ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	if ( grayscale !== undefined )	this.uniforms.grayscale.value = grayscale;
	if ( noiseIntensity !== undefined ) this.uniforms.nIntensity.value = noiseIntensity;
	if ( scanlinesIntensity !== undefined ) this.uniforms.sIntensity.value = scanlinesIntensity;
	if ( scanlinesCount !== undefined ) this.uniforms.sCount.value = scanlinesCount;

	this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene  = new Scene();

	this.quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

FilmPass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: FilmPass,

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		this.uniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.uniforms[ "time" ].value += delta;

		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		}

	}

} );


export default FilmPass;
