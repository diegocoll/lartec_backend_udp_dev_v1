var Schema = require('mongoose').Schema

//------------------------------------ Esquema de equipo

var EquipoEsq = new Schema ({

	//datos definidos por lartec

	firmware:      String,		//version de firmware
	hard_serie:    String,		//numero de serie de hardware
	hard_marca:    String,		//nombre del fabricante del equipo
	hard_version:  String,		//version del hardware

  //datos definidos por equipo

  ip: 	   String,  	//ultima direccion ip del equipo (6c)
  puerto:  String,		//puerto del equipo
  estado:  String,		//estado del equipo

	//datos definidos por cliente

  empresa:       String,    //identificador de la empresa
	vehiculo:  	 	 String,	  //patente del vehiculo
	_id:	 	 			 String,	  //identificador de equipo (6c)
	// equipo_id:	 	 String,	  //identificador de equipo (6c)

	ip_serv: 	 	   String,  	//ip del servidor a reportar
	puerto_serv: 	 String,	  //puerto del servidor a reportar

	numerosim1: 	 String,    //numero del chip sim1
	imeisim1:      String,    //numero de imei del sim1
	numerosim2: 	 String,    //numero del chip sim2
	imeisim2:      String,    //numero de imei del sim2

	//datos definidos por servidor

  fec_crea: { type: Date, default: Date.now }, 	//fecha del servidor al momento de la creacion del equipo (6c)
  fec_modi: Date,		//fecha del servidor al momento de la recepcion del ultimo reporte (6c)
  fec_ulti: Date,		//fecha del servidor al momento de la recepcion del ultimo reporte (6c)


	//datos definidos por reporte

	enc: String,			//encabezado de mensaje (3c)
	fec: String,			//fecha (6c)
	hor: String,			//hora (6c)
	lat: String, 			//latitud (9c)
	lon: String, 			//longitud (9c)
	vel: String,			//velocidad (3c)
	dir: String,			//direccion (3c)
	gps: String,			//calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
	eda: String,			//edad de gps (2h)
	csq: String,			//calida señal gsm (2c)
	evt: String,			//evento generarl (2h)
	dig: String,			//estado de entradas digitales (2h)
	nmg: String 			//numero de mensaje (7h)

},{ collection: 'Equipo' });

//------------------------------------ Exportacion de modulos

var Equi = module.exports = EquipoEsq;
