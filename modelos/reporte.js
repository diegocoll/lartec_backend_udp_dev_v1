var Schema = require('mongoose').Schema

//------------------------------------ Esquema de Reporte

var ReporteEsq = new Schema ({

	ip: 	 String,  		//ultima direccion ip del equipo (6c)
	puerto:  String,		//puerto del equipo
	estado:  String,		//estado del equipo

	fecserv: { type: Date, default: Date.now },	    //fecha del servidor al momento de la recepcion (6c)

	enc: String,	        //encabezado de mensaje (3c)
	fec: String,	        //fecha (6c)
	hor: String,	        //hora (6c)
	lat: String, 	        //latitud (9c)
	lon: String, 	        //longitud (9c)
	vel: String,	        //velocidad (3c)
	dir: String,	        //direccion (3c)
	gps: String,	        //calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
	eda: String,	        //edad de gps (2h)
	csq: String,	        //calida señal gsm (2c)
	evt: String,	        //evento generarl (2h)
	dig: String,					//estado de entradas digitales (2h)
	id_e: String,	        //identificador de equipo (6c)
	nmg: String, 	        //numero de mensaje (7h)
	id_e_obj: Object      //identificador de equipo (6c)

},{ collection: 'Reporte' });


//------------------------------------ Exportacion de modulo

var Repo = module.exports = ReporteEsq;
