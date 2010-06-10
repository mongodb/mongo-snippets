/* amb - for "nondeterministic" programs 
 *
 * this should work in a javascript shell such as spidermonkey.  i ran it in the
 * mongo shell via:
 *
 *   mongo --nodb amb.js
 *
 * */

/** Check that a given variable is true.
 * @param {any} x Variable to check.
 * @throws {Exception} If the variable is false.
 */
function require(x) {
    if( !x )
        throw "tryagain";
}

function amb(f, values) {
    for( var i = 0; i<values.length; i++ ) {
        try {
            var res = f(values[i]);
	    if( res ) return res;
        } catch(e if e=="tryagain") {
        }
    }
    return null;
}

/* --- example --- */

Array.prototype.amb = function(f) { return amb(f,this); };

Array.prototype.distinct = function() { 
    var a = this;
	for( var i = 1; i < a.length; i++ )
		if( a.indexOf(a[i]) != i )
			return false;
	return true;
}

function abs(a) { return a<0 ? -a : a; }	

/** Example Adapted from Structure and Interpretation of Computer Programs
    Abelson/Sussman/Sussman section 4.3.2
*/
res =  [1,2,3,4,5].amb( function(baker) {
return [1,2,3,4,5].amb( function(cooper) {
return [1,2,3,4,5].amb( function(fletcher) {
return [1,2,3,4,5].amb( function(miller) {
return [1,2,3,4,5].amb( function(smith) {

    require( [baker, cooper, fletcher, miller, smith].distinct() );
    require( baker != 5 );
    require( cooper != 1 );
    require( fletcher != 5 && fletcher != 1 );
    require( miller > cooper );
    require( abs(smith-fletcher) != 1 );
    require( abs(fletcher-cooper) != 1 );

    return [['baker',baker],
	    ['cooper',cooper],
	    ['fletcher',fletcher],
	    ['miller',miller],
	    ['smith',smith]];

})})})})});

print( tojson(res) );

