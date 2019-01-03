import {
  AddEquation,
  Color,
  CustomBlending,
  DataTexture,
  DepthTexture,
  DstAlphaFactor,
  DstColorFactor,
  FloatType,
  LinearFilter,
  LuminanceFormat,
  Math,
  Mesh,
  MeshNormalMaterial,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PlaneBufferGeometry,
  RGBAFormat,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  UnsignedShortType,
  Vector3,
  WebGLRenderTarget,
  ZeroFactor
} from 'three';
import CopyShader from '../shaders/CopyShader';
import Pass from './Pass';
import SSAOShader from '../shaders/SSAOShader';
import SimplexNoise from '../SimplexNoise';

/**
 * @author Mugen87 / https://github.com/Mugen87
 */

const SSAOPass = function ( scene, camera, width, height ) {

	Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;

	this.clear = true;

	this.camera = camera;
	this.scene = scene;

	this.kernelRadius = 8;
	this.kernelSize = 64;
	this.kernel = [];
	this.noiseTexture = null;
	this.output = 0;

	this.minDistance = 0.005;
	this.maxDistance = 0.1;

	//

	this.generateSampleKernel();
	this.generateRandomKernelRotations();

	// beauty render target with depth buffer

	var depthTexture = new DepthTexture();
	depthTexture.type = UnsignedShortType;
	depthTexture.minFilter = NearestFilter;
	depthTexture.maxFilter = NearestFilter;

	this.beautyRenderTarget = new WebGLRenderTarget( this.width, this.height, {
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		format: RGBAFormat,
		depthTexture: depthTexture,
		depthBuffer: true
	} );

	// normal render target

	this.normalRenderTarget = new WebGLRenderTarget( this.width, this.height, {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBAFormat
	} );

	// ssao render target

	this.ssaoRenderTarget = new WebGLRenderTarget( this.width, this.height, {
		minFilter: LinearFilter,
		magFilter: LinearFilter,
		format: RGBAFormat
	} );

	this.blurRenderTarget = this.ssaoRenderTarget.clone();

	// ssao material

	if ( SSAOShader === undefined ) {

		console.error( 'SSAOPass: The pass relies on SSAOShader.' );

	}

	this.ssaoMaterial = new ShaderMaterial( {
		defines: Object.assign( {}, SSAOShader.defines ),
		uniforms: UniformsUtils.clone( SSAOShader.uniforms ),
		vertexShader: SSAOShader.vertexShader,
		fragmentShader: SSAOShader.fragmentShader,
		blending: NoBlending
	} );

	this.ssaoMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
	this.ssaoMaterial.uniforms[ 'tNormal' ].value = this.normalRenderTarget.texture;
	this.ssaoMaterial.uniforms[ 'tDepth' ].value = this.beautyRenderTarget.depthTexture;
	this.ssaoMaterial.uniforms[ 'tNoise' ].value = this.noiseTexture;
	this.ssaoMaterial.uniforms[ 'kernel' ].value = this.kernel;
	this.ssaoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
	this.ssaoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
	this.ssaoMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );
	this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
	this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

	// normal material

	this.normalMaterial = new MeshNormalMaterial();
	this.normalMaterial.blending = NoBlending;

	// blur material

	this.blurMaterial = new ShaderMaterial( {
		defines: Object.assign( {}, SSAOBlurShader.defines ),
		uniforms: UniformsUtils.clone( SSAOBlurShader.uniforms ),
		vertexShader: SSAOBlurShader.vertexShader,
		fragmentShader: SSAOBlurShader.fragmentShader
	} );
	this.blurMaterial.uniforms[ 'tDiffuse' ].value = this.ssaoRenderTarget.texture;
	this.blurMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );

	// material for rendering the depth

	this.depthRenderMaterial = new ShaderMaterial( {
		defines: Object.assign( {}, SSAODepthShader.defines ),
		uniforms: UniformsUtils.clone( SSAODepthShader.uniforms ),
		vertexShader: SSAODepthShader.vertexShader,
		fragmentShader: SSAODepthShader.fragmentShader,
		blending: NoBlending
	} );
	this.depthRenderMaterial.uniforms[ 'tDepth' ].value = this.beautyRenderTarget.depthTexture;
	this.depthRenderMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
	this.depthRenderMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;

	// material for rendering the content of a render target

	this.copyMaterial = new ShaderMaterial( {
		uniforms: UniformsUtils.clone( CopyShader.uniforms ),
		vertexShader: CopyShader.vertexShader,
		fragmentShader: CopyShader.fragmentShader,
		transparent: true,
		depthTest: false,
		depthWrite: false,
		blendSrc: DstColorFactor,
		blendDst: ZeroFactor,
		blendEquation: AddEquation,
		blendSrcAlpha: DstAlphaFactor,
		blendDstAlpha: ZeroFactor,
		blendEquationAlpha: AddEquation
	} );

	//

	this.quadCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.quadScene = new Scene();
	this.quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), null );
	this.quadScene.add( this.quad );

	//

	this.originalClearColor = new Color();

};

SSAOPass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: SSAOPass,

	dispose: function () {

		// dispose render targets

		this.beautyRenderTarget.dispose();
		this.normalRenderTarget.dispose();
		this.ssaoRenderTarget.dispose();
		this.blurRenderTarget.dispose();

		// dispose geometry

		this.quad.geometry.dispose();

		// dispose materials

		this.normalMaterial.dispose();
		this.blurMaterial.dispose();
		this.copyMaterial.dispose();
		this.depthRenderMaterial.dispose();

	},

	render: function ( renderer, writeBuffer /*, readBuffer, delta, maskActive */ ) {

		// render beauty and depth

		renderer.render( this.scene, this.camera, this.beautyRenderTarget, true );

		// render normals

		this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );

		// render SSAO

		this.ssaoMaterial.uniforms[ 'kernelRadius' ].value = this.kernelRadius;
		this.ssaoMaterial.uniforms[ 'minDistance' ].value = this.minDistance;
		this.ssaoMaterial.uniforms[ 'maxDistance' ].value = this.maxDistance;
		this.renderPass( renderer, this.ssaoMaterial, this.ssaoRenderTarget );

		// render blur

		this.renderPass( renderer, this.blurMaterial, this.blurRenderTarget );

		// output result to screen

		switch ( this.output ) {

			case SSAOPass.OUTPUT.SSAO:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.ssaoRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, null );

				break;

			case SSAOPass.OUTPUT.Blur:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.blurRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, null );

				break;

			case SSAOPass.OUTPUT.Beauty:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, null );

				break;

			case SSAOPass.OUTPUT.Depth:

				this.renderPass( renderer, this.depthRenderMaterial, null );

				break;

			case SSAOPass.OUTPUT.Normal:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.normalRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, null );

				break;

			case SSAOPass.OUTPUT.Default:

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
				this.copyMaterial.blending = NoBlending;
				this.renderPass( renderer, this.copyMaterial, null );

				this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.blurRenderTarget.texture;
				this.copyMaterial.blending = CustomBlending;
				this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

				break;

			default:
				console.warn( 'SSAOPass: Unknown output type.' );

		}

	},

	renderPass: function ( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

		// save original state
		this.originalClearColor.copy( renderer.getClearColor() );
		var originalClearAlpha = renderer.getClearAlpha();
		var originalAutoClear = renderer.autoClear;

		// setup pass state
		renderer.autoClear = false;
		var clearNeeded = ( clearColor !== undefined ) && ( clearColor !== null );
		if ( clearNeeded ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );

		}

		this.quad.material = passMaterial;
		renderer.render( this.quadScene, this.quadCamera, renderTarget, clearNeeded );

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );

	},

	renderOverride: function ( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

		this.originalClearColor.copy( renderer.getClearColor() );
		var originalClearAlpha = renderer.getClearAlpha();
		var originalAutoClear = renderer.autoClear;

		renderer.autoClear = false;

		clearColor = overrideMaterial.clearColor || clearColor;
		clearAlpha = overrideMaterial.clearAlpha || clearAlpha;

		var clearNeeded = ( clearColor !== undefined ) && ( clearColor !== null );

		if ( clearNeeded ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );

		}

		this.scene.overrideMaterial = overrideMaterial;
		renderer.render( this.scene, this.camera, renderTarget, clearNeeded );
		this.scene.overrideMaterial = null;

		// restore original state

		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );

	},

	setSize: function ( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );
		this.ssaoRenderTarget.setSize( width, height );
		this.normalRenderTarget.setSize( width, height );
		this.blurRenderTarget.setSize( width, height );

		this.ssaoMaterial.uniforms[ 'resolution' ].value.set( width, height );
		this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
		this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

		this.blurMaterial.uniforms[ 'resolution' ].value.set( width, height );

	},

	generateSampleKernel: function () {

		var kernelSize = this.kernelSize;
		var kernel = this.kernel;

		for ( var i = 0; i < kernelSize; i ++ ) {

			var sample = new Vector3();
			sample.x = ( Math.random() * 2 ) - 1;
			sample.y = ( Math.random() * 2 ) - 1;
			sample.z = Math.random();

			sample.normalize();

			var scale = i / kernelSize;
			scale = Math.lerp( 0.1, 1, scale * scale );
			sample.multiplyScalar( scale );

			kernel.push( sample );

		}

	},

	generateRandomKernelRotations: function () {

		var width = 4, height = 4;

		if ( SimplexNoise === undefined ) {

			console.error( 'SSAOPass: The pass relies on SimplexNoise.' );

		}

		var simplex = new SimplexNoise();

		var size = width * height;
		var data = new Float32Array( size );

		for ( var i = 0; i < size; i ++ ) {

			var x = ( Math.random() * 2 ) - 1;
			var y = ( Math.random() * 2 ) - 1;
			var z = 0;

			data[ i ] = simplex.noise3d( x, y, z );

		}

		this.noiseTexture = new DataTexture( data, width, height, LuminanceFormat, FloatType );
		this.noiseTexture.wrapS = RepeatWrapping;
		this.noiseTexture.wrapT = RepeatWrapping;
		this.noiseTexture.needsUpdate = true;

	}

} );

SSAOPass.OUTPUT = {
	'Default': 0,
	'SSAO': 1,
	'Blur': 2,
	'Beauty': 3,
	'Depth': 4,
	'Normal': 5
};


export default SSAOPass;
