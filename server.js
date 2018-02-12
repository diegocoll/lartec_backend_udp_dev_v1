//------------------------------------------------------- UDP server

var dgram		= require("dgram");
var server	= dgram.createSocket("udp4");
var os			= require('os');

// var io 	   = require('socket.io-client');

// var http   = require('http');

var mongoose	= require('mongoose');

var configDB 	= require('./config/database.js');

//------------------------------------ Base de datos

var DB = mongoose.connect(configDB.url, function(err, res) {

	if(err) {
    	console.log('ERROR: Base de datos no conectada ('+ err +')');
	} else {
    	console.log('Base de datos conectada');
	}

});

//------------------------------------ Importacion de modelos

var ReporteudpEsq = require('./modelos/reporteudp');
var ReporteEsq    = require('./modelos/reporte');
var EquipoEsq   	= require('./modelos/equipo');

var REPOUDP = mongoose.model('REPOUDP', ReporteudpEsq);
var REPORTE	= mongoose.model('REPORTE', ReporteEsq);
var EQUIPO	= mongoose.model('EQUIPO', EquipoEsq);

//------------------------------------ Variables

var PORT   = "4444";
//var HOST   = "35.198.8.140";
var HOST   = getIPAddress();

//------------------------------------ Funciones

function getIPAddress() {
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '127.0.0.1';
}

function checksumf (strinn){
	var check = "";
	for (var i = 0; i < strinn.length; i++)
		{
		check ^= strinn[i].charCodeAt();
		if(strinn[i] === "*")
			{
			break;
			}
		};

	check = check.toString(16).toUpperCase();		// (ver si conviene convertir en Mayuscula)

	if (check.length===1)
  	{
  		check = "0"+check;
  	};

	return check
};


function log_reporte_udp(remote, reporte_str, id_eqp_rpt, numero_rpt){

	// console.log(reporte_str);

	//------------------------------------ Creacion del esquema

	var Reporte = new REPOUDP({
		reporte: reporte_str,
		ip: remote.address,
		puerto: remote.port
	});

	//------------------------------------ Guardado en la base de datos

	Reporte.save(function (err) {
		if (err){

			console.log("Error al guardar los datos");

		} else {

			//------------------------------------ emisión de mensaje al cliente

			// io.emit('data_method',reporte_str); INSTALAR SOCKETIO

			var stringACK = ">SAK;"+ id_eqp_rpt +";"+ numero_rpt +";*" ;

			//------------------------------------ Calculo del checksum

			var checksum = checksumf(stringACK);

			//------------------------------------ Armado del buffer para el ACK

			var ACK = new Buffer([0x0D,0x0A,,,,,,,,,,,,,,,,,,,,,0x0D,0x0A]);

			ACK.write(">SAK;"+ id_eqp_rpt +";"+ numero_rpt +";*"+ checksum +"<",2);

			//------------------------------------ Envio de ACK

			server.send(ACK, 0, ACK.length, remote.port, remote.address, function(err, bytes) {
			    if (err) throw err;

			    // console.log('Respuesta ACK'+ ACK +'enviada al equipo ' + remote.address + ':' + remote.port);
			    // io.emit('resp_equi',remote);
			});
  	}
	});
};


function grabado_reporte_RGP(remote, rpt, objectId){

	//------------------------------------ Creacion del esquema

	var Reporte = new REPORTE({

		ip: remote.address,
		puerto: remote.port,

		// fecserv: fechaser,    // SE AGREGA AUTOMATICAMENTE CUANDO SE CREA EL MODELO

		enc: rpt[0].substr(1,3),    	 //encabezado de mensaje (3c)
		fec: rpt[0].substr(4,6),       //fecha (6c)
		hor: rpt[0].substr(10,6),      //hora (6c)
		lat: rpt[0].substr(16,9),      //latitud (9c)
		lon: rpt[0].substr(25,10),     //longitud (9c)
		vel: rpt[0].substr(35,3),    	 //velocidad (3c)
		dir: rpt[0].substr(38,3),    	 //direccion (3c)
		gps: rpt[0].substr(41,1),      //calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
		eda: rpt[0].substr(42,2),      //edad de gps (2h)
		csq: rpt[0].substr(44,2),      //calida señal gsm (2c)
		dig: rpt[0].substr(46,2),      //estado de entradas digitales (2h)
		evt: rpt[0].substr(48,2),      //evento generarl (2h)
		id_e: rpt[1].substr(0,5),   	 //identificador de equipo (6c)
		nmg: rpt[2].substr(0,4),        //numero de mensaje (7h)
		id_e_obj: objectId
	});

	// console.log(Reporte);

	//------------------------------------ Guardado en la base de datos

	Reporte.save(function (err) {
		if (err){
			console.log("Error al guardar los datos");
			console.log(err);
		}
		else {
			console.log("guardado correcto");
			// equipo_reporte_RGP(remote, Reporte);
		}
	});
};

function equipo_reporte_RGP(remote, rpt){

//----------------------------------------------------------------- busqueda del equipo en la base de datos

	var id_e = rpt[1].substr(0,5);

	EQUIPO.findOne({equipo_id:id_e}, function(err,Equipo){
		if (Equipo==null){

			//console.log("Equipo NO encontrado en la base de datos de equipos");

			var objectId = mongoose.Types.ObjectId();
			// var objectId = new ObjectID(); // Generacion del objectId

			grabado_reporte_RGP(remote, rpt, objectId);

			var Equipo = new EQUIPO({

				_id: objectId,							//objectId generado

				ip: 	 remote.address,  	//ultima direccion ip del equipo (6c)
				puerto:  remote.port,			//puerto del equipo (6c)

				estado:  "ok",						//estado del equipo
				empresa: "Indefinido",		//empresa a la que pertenece el equipo
				vehiculo: "Indefinido",		//vehiculo al que pertenece el equipo
				equipo_id: rpt[1].substr(0,5),

				ip_serv: 	 	   HOST,  		//ip del servidor a reportar
				puerto_serv: 	 PORT,	  	//puerto del servidor a reportar

				numerosim1: 	 "Indefinido",    //numero del chip sim1
				imeisim1:      "Indefinido",    //numero de imei del sim1
				numerosim2: 	 "Indefinido",    //numero del chip sim2
				imeisim2:      "Indefinido",    //numero de imei del sim2

				fec_modi: new Date(),				//fecha del servidor al momento de la recepcion del ultimo reporte (6c)
				fec_ulti: new Date(),				//fecha del servidor al momento de la recepcion del ultimo reporte (6c)

				enc: rpt[0].substr(1,3),    	 //encabezado de mensaje (3c)
				fec: rpt[0].substr(4,6),       //fecha (6c)
				hor: rpt[0].substr(10,6),      //hora (6c)
				lat: rpt[0].substr(16,9),      //latitud (9c)
				lon: rpt[0].substr(25,10),     //longitud (9c)
				vel: rpt[0].substr(35,3),    	 //velocidad (3c)
				dir: rpt[0].substr(38,3),    	 //direccion (3c)
				gps: rpt[0].substr(41,1),      //calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
				eda: rpt[0].substr(42,2),      //edad de gps (2h)
				csq: rpt[0].substr(44,2),      //calida señal gsm (2c)
				dig: rpt[0].substr(46,2),      //estado de entradas digitales (2h)
				evt: rpt[0].substr(48,2),      //evento generarl (2h)
				// id_e: rpt[1].substr(0,5),   	 //identificador de equipo (6c)
				nmg: rpt[2].substr(0,4)        //numero de mensaje (7h)

				// enc: reporte.enc,				  //encabezado de mensaje (3c)
				// fec: reporte.fec,					//fecha (6c)
				// hor: reporte.hor, 				//hora (6c)
				// lat: reporte.lat, 				//latitud (9c)
				// lon: reporte.lon, 				//longitud (9c)
				// vel: reporte.vel,					//velocidad (3c)
				// dir: reporte.dir,					//direccion (3c)
				// gps: reporte.gps,					//calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
				// eda: reporte.eda,					//edad de gps (2h)
				// csq: reporte.csq,					//calida señal gsm (2c)
				// evt: reporte.evt,					//evento generarl (2h)
				// dig: reporte.dig,					//estado de entradas digitales (2h)
				// // id:  reporte.id_e,					//identificador de equipo (6c)
				// nmg: reporte.nmg  				//numero de mensaje (7h)
				});

			Equipo.save(function (err) {
				if (err){
					console.log("Error al guardar los datos en la base de equipos");
					console.log(err);
				}
				else{
					// grabado_reporte_RGP(remote, rpt)
					// client.emit('nuevoequipo',Equipo);
					// console.log("Nuevo equipo creado en la base de equipos");
				}
			});
		}
		else{

			//----------------------------------------------------------------- creacion de notificaciones

			// CREAR EL CODIGO PARA NOTIFICAR AL USUARIO EN CASO DEL TIPO DE EVENTO

			//----------------------------------------------------------------- guardado en la base de equipos

			var objectId = mongoose.Types.ObjectId(Equipo.id);

			grabado_reporte_RGP(remote, rpt, objectId);

			// console.log(Equipo.id);

			Equipo.ip = 	 	 remote.address;  //ultima direccion ip del equipo (6c)
			Equipo.puerto =  remote.port;			//puerto del equipo (6c)

			Equipo.ip_serv =	 	   HOST;  		//ip del servidor a reportar
			Equipo.puerto_serv = 	 PORT;	  	//puerto del servidor a reportar

			Equipo.fec_ulti = new Date();				//fecha del servidor al momento de la recepcion del ultimo reporte (6c)

			Equipo.enc	= rpt[0].substr(1,3);				//encabezado de mensaje (3c)

			Equipo.fec	= rpt[0].substr(4,6);			//fecha (6c)

		  Equipo.hor	= rpt[0].substr(10,6);			//hora (6c)

			if (rpt[0].substr(16,9).substr(1,1) != "?") {
				Equipo.lat	= rpt[0].substr(16,9); 			//latitud (9c)
			};

			if (rpt[0].substr(25,10).substr(1,1) != "?") {
				Equipo.lon	= rpt[0].substr(25,10); 			//longitud (9c)
			};

			if (rpt[0].substr(35,3).substr(1,1) != "?") {
				Equipo.vel	= rpt[0].substr(35,3);			//velocidad (3c)
			};

			if (rpt[0].substr(38,3).substr(1,1) != "?") {
				Equipo.dir	= rpt[0].substr(38,3);			//direccion (3c)
			};

			Equipo.gps	= rpt[0].substr(41,1);				//calida señal gps 1 = nada ; 2 = 2d ; 3 = 3d (1c)
			Equipo.eda	= rpt[0].substr(42,2);				//edad de gps (2h)
			Equipo.csq	= rpt[0].substr(44,2);				//calida señal gsm (2c)
			Equipo.evt	= rpt[0].substr(48,2);				//evento generarl (2h)
			Equipo.dig	= rpt[0].substr(46,2);				//estado de entradas digitales (2h)
			//Equipo.id_e	= rpt[1].substr(0,5);				//identificador de equipo (6c)
			Equipo.nmg	= rpt[2].substr(0,4); 				//numero de mensaje (7h)

			Equipo.save(function (err) {
				if (err){
					console.log("Error al guardar los datos en la base de equipos");
					console.log(err);
				}
				// else{
				// 	console.log("Datos actualizados en la base de equipos");
				// }
			});
		}
	});
};



//------------------------------------ Servidor

server.on("error", function (err) {
	console.log("servidor error:\n" + err.stack);
	server.close();
});


//------------------------------------ RECEPCION DE DATAGRAMAS

server.on("message", function (reporte, remote) {

	console.log("reporte: " + reporte + " de " + remote.address + ":" + remote.port);

  var reporte_str = reporte.toString().toUpperCase();

  //------------------------------------ Calculo del checksum

  var checksum = checksumf(reporte_str);

  //------------------------------------ mini Parseo de mensaje
	//------------------------------------ ESTE PARSEO NO CONTEMPLA LAS OTRAS CABECERAS (VA A FALLAR)
	//------------------------------------ AHORA RESUELVE LOS VALORES DE POSICION FIJA, A LOS VALORES...
	//------------------------------------ ESPECIFICOS DE CADA CABECERA SE LOS RESUELVE EN SU SECCION

	var rpt = reporte_str.split(";");

  var cabeza_rpt  = rpt[0].substr(1,3);
	var id_eqp_rpt  = rpt[rpt.length-3].substr(0,5);
	var numero_rpt  = rpt[rpt.length-2].substr(0,4);
  var checksum_rpt  = rpt[rpt.length-1].substr(1,2);

  //------------------------------------ Validacion del checksum

  if (checksum === checksum_rpt) {
    //------------------------------------ Identificacion de cabecera y Validacion del longitud

  	//identifica el tipo de reporte que llega al servidor y hace una comprobacion de longitud diferente!!
		log_reporte_udp(remote,reporte_str,id_eqp_rpt,numero_rpt);

  	switch (cabeza_rpt)
      {
        case "RGP":

					// SEAGREGA LA DOBLE CONDICION EN EL IFDEBIDO A
					// QUE LA LAT/LON? CAMBIAN EL TAMAÑO. CHAGUI TIENE QUE
					// ARREGLAR ESO EN EL EQUIPO (CORROBORAR)

					// if (reporte.length === 66 || reporte.length === 65){

		      if (reporte.length === 66){
						equipo_reporte_RGP(remote, rpt);
						console.log('RGP');
						// grabado_reporte_RGP(remote, rpt);
		      } else {
						console.log('Longitud incorrecta RGP');
					}
		      break;
        case "ROP":
          // if (reporte.length === 79 || reporte.length === 78){
          if (reporte.length === 79){
          	// log_reporte_udp(remote,reporte_str,id_eqp_rpt,numero_rpt);
						console.log('ROP');
						// AGREGAR LA FUNCION ESPECITICA PARA ESTE TIPO DE REPORTE
          } else {
  					console.log('Longitud incorrecta ROP');
  				}
          break;
        case "RTP":
          // if (reporte.length === 80 || reporte.length === 79){
          if (reporte.length === 80){
          	// log_reporte_udp(remote,reporte_str,id_eqp_rpt,numero_rpt);
						console.log('RTP');
						// AGREGAR LA FUNCION ESPECITICA PARA ESTE TIPO DE REPORTE
          } else {
		  			console.log('Longitud incorrecta RTP');
		  		}
          break;
        default:
          console.log('Cabeza de reporte no identificada: ' + cabeza_rpt);
          break;
      }
  } else {
  		console.log('checksum incorrecto');
  }
});

server.on("listening", function () {
	console.log("servidor corriendo " + HOST + ":" + PORT);
});

server.bind(PORT, HOST);
