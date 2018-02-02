var Schema = require('mongoose').Schema

//------------------------------------ Esquema de Reporte udp

var ReporteudpEsq = new Schema ({

	reporte: String,	  //Reporte completo (6c)

  ip: 	 String,  		//ultima direccion ip del equipo (6c)
	puerto:  String,		//puerto del equipo
	estado:  String,		//estado del equipo

	fecserv: { type: Date, default: Date.now },	    //fecha del servidor al momento de la recepcion (6c)
	//horserv: Date,	  //hora del servidor al momento de la recepcion (6c)

	});

//------------------------------------ Exportacion de modulos

var Repoudp = module.exports = ReporteudpEsq;
