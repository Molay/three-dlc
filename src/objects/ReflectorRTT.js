import Reflector from './Reflector';

const ReflectorRTT = function ( geometry, options ) {

	Reflector.call( this, geometry, options );

	this.geometry.setDrawRange( 0, 0 ); // avoid rendering geometry

};

ReflectorRTT.prototype = Object.create( Reflector.prototype );


export default ReflectorRTT;
