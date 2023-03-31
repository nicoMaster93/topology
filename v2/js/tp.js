/**
 *  @author Nicolas Hernandez 
 *  @description Crea una interfaz grafica de la topologia de manera configurable desde el dom
 *  @company e-solutions 
 *  @date 2023-02-17
 * @version 2
 * */


 class tp {

    constructor(obj={},load=false){
        if(load){
            this.config = obj;
            /* Crea los nodos. */
            this.nodes = [];
            /* Crea la info con los links que conectan los nodos. */
            this.edges = [];
            /* Instanciará el objeto que pinta la TP */
            this.network = null;

            if(this.existElm(`[data-scriptjs="visJs"]`)){
                /* Llamamos al método que via ajax trae el json con los datos de la topología */
                this.loadTP();
            }else{
                this.log(`La librería visJs no ha sido cargada en el documento [data-scriptjs="visJs"] `,'error');
            }
        };
    };
    omiteKeys(){
        return ['parent', 'children', 'sibling','image','layer','agent','shape','group','faults','color'];
    };
    /* imprime en la consola los logs de la clase */
    log(msj,type='info'){
        const obj  = this.config;
        if(typeof obj.showConsole == 'boolean' && obj.showConsole){
            switch (type) {
                case 'info':
                    console.info(msj);
                break;
                case 'log':
                    console.log(msj);
                break;
                case 'error':
                    console.error(msj);
                break;
                case 'debug':
                    console.debug(msj);
                break;
                    
            };
        };
    };
    /* Muestra el loader */
    loading(hidden = false){
        const containerLoading = (this.config.containerDomCanvas !== undefined ? this.config.containerDomCanvas : 'body');
        const imgHostname = (this.config.imageLoader !== undefined ? this.config.imageLoader : './css/logoEsol.png');

        if($("#containerLoading").length == 0 ){
            const htmlLoading = $('<div class="containerLoading in" id="containerLoading"></div>');
            htmlLoading.html('<div class="doubleLine"> <div></div> <div></div> <div> <div></div> </div> <div> <div></div> </div> <div class="imgCenter"> <img src="'+imgHostname+'" alt="Cargando..." ></div></div>');
            $(containerLoading).append(htmlLoading);
            if(hidden == true){
                $("#containerLoading").removeClass('in');
                setTimeout(function(){
                    $("#containerLoading").remove();
                },500);
            };
        }else{
            $(".containerLoading").removeClass('in');
            setTimeout(function(){
                $(".containerLoading").remove();
            },500);
        };
    };
    /* Metodo para peticiones por ajax */
    ajax(page,jsonSend,metod,funcion,erno,rtn=null){
		$.ajax({
			type:metod,
			url: page,
			data:jsonSend,
			cache: false,
			contentType: false,
			processData: false,
			success:function(data){
                if ((rtn=='json' || rtn=='js' || rtn=='JSON') && typeof data === 'string'){
                    data = JSON.parse(data);
                };
				if(typeof funcion != 'undefined'){
					funcion(data);
				};
			},
			error: function(data){
				if(typeof erno == 'function'){
                    erno(data);
                };
			}
		});
	};
    /* valida si un elemento ya existe */
    existElm(elm){
        let ret = false;
        if($(elm).length > 0){
            ret = true;
        };
        return ret;
    };
    sort(array,key,order='asc'){
      array.sort((a, b) => {
        var timeA = a[key];
        var timeB = b[key];
        if(order == 'asc'){
          if(timeA < timeB){
              return -1;
          }else if(timeA > timeB){
              return 1;
          }
        }else if(order == 'desc'){
          if(timeA > timeB){
            return -1;
        }else if(timeA < timeB){
            return 1;
        }
        }
        return 0;
      });
      return array;
    };
    /* Método que inicia la Topologia */
    loadTP(){
        const ajax = this.ajax;
        const conn = this.config.server;
        this.loading();

        let formData = new FormData();

        if(typeof conn.data === "object"){
            for(var i in conn.data){
                const element = conn.data[i];
                if(typeof element === 'object'){
                    formData.append(i,JSON.stringify(element));
                }else{
                    formData.append(i,element);
                }
            }
        }else{
            this.log("post debe ser de tipo object","error");
        }
        
        ajax(conn.url,formData,conn.method,(response)=>{
            this.dataTP = response.data;
            this.config.dataTPFooter = (response.footer ? response.footer : null);
            if(this.config.dataTPFooter){
                /* Ordeno el arreglo por las fechas de  menor a mayor  */
                this.config.dataTPFooter = this.sort(this.config.dataTPFooter, 'update_time', 'asc');
            }
            
            this.config.dataSeverityClass = response.severityClass ;
            
            this.config.lastUpdate = {
                time : response.time,
                timeDate : response.timeDate
            };
            this.config.arrIdsTP = Object.keys(this.dataTP);
            if(Object.keys(this.dataTP).length > 0){
                this.buildTp((r)=>{
                    /* Finaliza de renderizar los nodos */
                    this.loading(true);
                    /* Si se envia id dentro de los parametros y este existe en el arreglo, envio para que lo centre en el canvas */
                    if(typeof conn.data.params == 'object'){
                        setTimeout(() => {
                            this.selectNode(this.config,[ this.config.server.data.params.id ]);
                            this.config.dataTpCanvas.network.focus([ this.config.server.data.params.id ],{
                                scale: (this.config.scale !== undefined ? this.config.scale : 0.75),
                                animation:true
                            });
                        }, 500);
                        setTimeout(() => {
                            this.config.dataTpCanvas.network.stopSimulation();
                            /* Esta linea comentada realiza la accion de ajustar la tp a la pantalla luego de hacer zoom  */
                            /* this.config.dataTpCanvas.network.fit({animation:true}); */
                        }, 2000);
                    }
                    /* AL momento de cargar todos los nodos validamos si esta habilitado la actualizzacion automatica */
                    if(typeof this.config.serverInterval == 'object'){
                        const timer = (conn.time !== undefined ? (conn.time * 1000) : 5000 );
                        setTimeout(() => {
                            this.intervalUpdate((new tp(this.config)), this.config, this.nodes); 
                        }, timer);
                    }

                    this.showFooterInfo();
                    
                });
            }else{
                this.log("No hay registros para mostrar",'info');
                $(`#${this.config.domId}`).html("<p>No hay registros para mostrar</p>");
                this.loading(true);
            }
        },false,'js');
    };
    /* Contruye el canvas y pinta los nodos devueltos por el JSON */
    buildTp(endCallback) {
        
        const EDGE_LENGTH_MAIN = 400;
        const EDGE_LENGTH_SUB = 200;
        const allData = this.dataTP;
        this.config.filters_severities = {
          total:0, 
          maxSeverity:null, 
          inputs : {
            5:0, /* Critico */
            4:0, /* Mayor */
            2:0 /* Precaucion */
          } 
        };

        for(const [key, value] of Object.entries(allData) ){
	        
            let filter = this.nodes.find((used)=>{          
                return used == key; 
            });
            // console.log(key,value)
	        if(!filter){
                let nodeInfo = {
                    ...value,
                    image: this.config.pathImageNode + this.classNodeByType(value.type),
                    shape: "image", //"circularImage",
                    label: (this.config.label !== undefined ? value[this.config.label] : '' ),
                    title: (this.config.title !== undefined ? value[this.config.title] : '' ),
                    color:{
                        background: this.statusNode(value.status)['border'],
                        border: (value.max_severity !== undefined ) ? this.statusSeverityNode(value.max_severity)['color'] : 'white',
                        highlight: {
                            background: this.statusNode(value.status)['border'],
                            border: (value.max_severity !== undefined ) ? this.statusSeverityNode(value.max_severity)['color'] : 'white',
                        },
                        hover: {
                            border: '#2B7CE9',
                            background: '#D2E5FF'
                        }
                    }
                };

                if(value.parent !== undefined){ 

                    for(const [keyParent, valueParent] of Object.entries(value.parent) ){
                        this.edges.push({
                                from: value.id,
                                to: valueParent,
                                color: { 
                                    color: "#406897", 
                                    // highlight: "purple" 
                                },
                                length: EDGE_LENGTH_MAIN,
                                label: ((this.config.labelEdge !== undefined && this.config.labelEdge ) ?  `${ value[this.config.label] } → ${ allData[valueParent][this.config.label] }` : '' ) 
                            });
                    };
                };
                if(value.sibling !== undefined){ 
                    for(const [keySibling, valueSibling] of Object.entries(value.sibling) ){
                            this.edges.push({
                                    from: key,
                                    to: valueSibling,
                                    color: { 
                                        color: "red", 
                                        // highlight: "orange" 
                                    },
                                    length: EDGE_LENGTH_SUB,
                                    label: ((this.config.labelEdge !== undefined && this.config.labelEdge ) ?  `${ value[this.config.label] } → ${ allData[valueSibling][this.config.label] }` : '' ) 
                            });
                    };
                };
                
                this.nodes.push(nodeInfo);

                /* Agrego el filtro de busqueda */
                this.config.filters = [];
                
                if(typeof value === 'object'){
                    for(var i in value){
                        if((this.config.filters.indexOf(i) < 0) && this.omiteKeys().indexOf(i) < 0 ){
                            this.config.filters.push(i);
                        }
                        /* Agrego el filtro de las severidades */
                        if(i == 'number'){
                            this.config.filters_severities['total'] += value.number;
                        }
                        if(i == 'max_severity'){
                            this.config.filters_severities['maxSeverity'] = (this.config.filters_severities['maxSeverity'] < value.max_severity ? value.max_severity : this.config.filters_severities['maxSeverity'] );
                        }
                        /* Agrego los tipos de severidad */
                        if(i == 'faults'){
                          for(const [k, v] of Object.entries(value.faults.severity) ){
                            if(this.config.filters_severities['inputs'][k] !== undefined){
                              this.config.filters_severities['inputs'][k] += v;
                            }
                          }
                        }

                    }
                }


                

	        };
	    };
        const nodes = new vis.DataSet(this.nodes);  /* Seteo los valores */
        const links = new vis.DataSet(this.edges);  /* Seteo los valores */

        var data = {
            nodes: nodes,
            edges: links,
          };

          var options = {
              physics: {
                  forceAtlas2Based: {
                    gravitationalConstant: -86,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18,
                  },
                  maxVelocity: 146,
                  solver: "forceAtlas2Based",
                  timestep: 0.35,
                  stabilization: {
                    iterations: 150
                  },
                  barnesHut: {
                    theta: 0.5,
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0
                }
            },
            nodes: {
                borderWidth: 2,
                borderWidthSelected:4,
                size: 20,
                font: { color: "#406897" },
                shapeProperties: {
                    useImageSize: false,
                    useBorderWithImage: true,
                    interpolation: true,
                },
                scaling: {
                    min: 10,
                    max: 30
                },
                // imagePadding: {
                //     left: 5,
                //     top: 5,
                //     bottom: 5,
                //     right: 5
                // },
                // shapeProperties: {
                //     interpolation: true,  // only for image and circularImage shapes
                //     useImageSize: true,  // only for image and circularImage shapes
                //     useBorderWithImage: true,  // only for image shape
                //     coordinateOrigin: 'center'  // only for image and circularImage shapes
                // }
            },
            edges: {
              width: 0.15,
            //   arrows: "",
              smooth: {
                type: "continuous",
              }
            },
            interaction:{
                hover: true,
                hoverConnectedEdges: true,
                hideEdgesOnDrag: true,
                tooltipDelay: 200,
                navigationButtons: (this.config.buttonNavigate !== undefined ? this.config.buttonNavigate : false ),
            }
          };
        this.config.baseOptionsNode = options;
        /* create a network */
        var container = document.getElementById(this.config.domId);

        /* initialize your network! */
        this.network = new vis.Network(container, data, options);
                
        
        const objDom = this.config;
        this.config.dataTpCanvas = {
            network : this.network,
            nodes: nodes,
            links: links
        };
        
        /* Accionan eventos de click por cada nodo */
        const infoByNode = this.infoByNode;
        const config = this.config;
        this.network.on( 'selectNode', function(properties) {
            let nodo = properties.nodes;
            let infoNode = nodes.get(nodo);
            infoByNode(infoNode[0],objDom,true);
            $(`#container_filter_${objDom.uuid}`).removeClass('active');
            $(`#backBtnTp_${objDom.uuid}`).click();
        });

        this.network.on( 'selectEdge', function(properties) {
            let link = properties.edges;
			let infoLink = links.get(link);
            objDom.onclickLink(infoLink);  
        });
        
        this.network.on( 'hoverNode', function(properties) {
            let nodo = properties.node;
            let infoNode = nodes.get(nodo);
            config.hoverNode(nodo,infoNode)
        });
        
        this.network.on( 'blurNode', function(properties) {
            setTimeout(() => {
                objDom.dataTpCanvas.network.stopSimulation();
            }, 100);
        });

        this.network.on( 'dragEnd', function(properties) {
            setTimeout(() => {
                objDom.dataTpCanvas.network.stopSimulation();
            }, 100);
        });

        this.generateSummary();

        this.network.once("stabilizationIterationsDone", function () {
            setTimeout(function () {
                endCallback(100);
            }, 500);
        });

    };
    /* Validamos el tipo de imagen  */
    classNodeByType(type){
        var image = null;
        switch (type) {
            case "FIREWALL":
                image = `firewall_1.png`;
            break;
            case "ROUTER":
                image = `router_1.png`;
            break;
            case "SW":
                image = `sw_1.png`;
            break;
            case "SWITCH":
                image = `sw_1.png`;
            break;
            case "WIRELESS CONTROLLER":
                image = `wl_1.png`;
            break;
            case "COOLING":
                image = `cooling_1.png`;
            break;
            case "UPS":
                image = `ups_1.png`;
            break;
            case "RADIOS":
                image = `radio_1.png`;
            break;
            case "Rectificadores":
                image = `rectificator_1.png`;
            break;
            
            /* Iconos Pendiente por actualizar */

            case "ACCESS POINT":
                image = `access_point.png`;
            break;
            case "SWL3":
                image = `sw_1.png`;
            break;
            case "Management Module":
                image = `access_point.png`;
            break;
            case "PLANTAS IP":
                image = `access_point.png`;
            break;
            case "Rectificadores":
                image = `access_point.png`;
            break;
            case "SERVIDOR":
                image = `radio_1.png`;
            break;
        }
        return image;
    };
    /* Validamos los estados del color del nodo */
    statusNode(status){
        var chng = false;
        var rtn = {};
        switch (status){
            case '-1':
                /* purpura */
                chng = true;
                rtn['border'] = "#d66cd6";
                rtn['color'] = "white";
                rtn['label'] = "Never seen";
            break;
            case '0':
                /* verde */
                chng = true;
                rtn['border'] = "#4dd04d";
                rtn['color'] = "white";
                rtn['label'] = "Ok";
            break;
            case '1':
                chng = true;
                rtn['border'] = "red";
                rtn['color'] = "white";
                rtn['label'] = "ICMP Down";
            break;
            case '2':
                /* Naranja */
                chng = true;
                rtn['border'] = "#ffa400";
                rtn['color'] = "white";
                rtn['label'] = "SNMP Down";
            break;
            default:
                chng = true;
                rtn['border'] = "black";
                rtn['color'] = "white";
                rtn['label'] = "unmanaged";
            break;
        }
        if(!chng){
            rtn = null;
        }
        return rtn;
    };
    /* Validamos los estados de la severidad y retornamos el color */
    statusSeverityNode(status){
        var chng = false;
        var rtn = {};
        switch (status){
            case '0':
                /* verde claro */
                chng = true;
                rtn['color'] = "#27DE55";
                rtn['label'] = "Ok";
            break;
            case '1':
                /* Purpura */
                chng = true;
                rtn['color'] = "#800080";
                rtn['label'] = "Indeterminado";
            break;
            case '2':
                /* azul claro */
                chng = true;
                rtn['color'] = "#00CCFF";
                rtn['label'] = "Precaucion";
            break;
            case '3':
                /* Amarillo */
                chng = true;
                rtn['color'] = "#FFFF00";
                rtn['label'] = "Menor";
            break;
            case '4':
                /* Naranja */
                chng = true;
                rtn['color'] = "#FF9900";
                rtn['label'] = "Mayor";
            break;
            case '5':
                /* Rojo */
                chng = true;
                rtn['color'] = "#FF0000";
                rtn['label'] = "Critico";
            break;
            default:
              chng = true;
              rtn['color'] = "white";
            break;
        }
        if(!chng){
            rtn = null;
        }
        return rtn;
    };
    /* Creamos vista de resumen */
    generateSummary(){
        const obj = this.config;
        const nodos = this.nodes;
        const search = this.searhByFilterTp;
        const resetSelection = this.resetSelection;
        const infoByNode = this.infoByNode;

        let filtros = '';
        let buttomRealTime = '';
        if(typeof obj.serverInterval == 'object' && Object.keys(obj.serverInterval).length > 0){
            buttomRealTime = `<button  id="btnRealTime_${this.config.uuid}" data-id="${this.config.uuid}" data-active title="Down Real Time" class="icon-real-time toggleRealTime active" ></button>`;
        }
        if(typeof obj.showFilters == 'boolean' && obj.showFilters==true){
            filtros = `
                <button id="btnToggle_${this.config.uuid}" data-id="${this.config.uuid}" title="Mas Información" class="toggleFilter" > Mostrar Filtros </button>
                <div class="filter_tp" id="filter_tp_${this.config.uuid}" >
                    <div class="inputs">
                        <form autocomplete="off" id="frm_filterTp_${this.config.uuid}" data-idfrm="${this.config.uuid}">
                            <label for="searchNode_${this.config.uuid}">Buscar por:</label>
                            <select id="searchNode_${this.config.uuid}" name="searchNode" required></select>
                            <input type="text" name="filter_txt" id="searchNodeValue_${this.config.uuid}" placeholder="Escribe aquí" autocomplete="off" required>
                            <button type="submit">Buscar</button>
                            <button type="reset" id="clean_${this.config.uuid}" data-id="${this.config.uuid}">Limpiar</button>
                        </form>
                    </div> 
                </div>
            <hr>`;
        }
        const dom = `
        <article data-uuid="${this.config.uuid}" id="container_filter_${this.config.uuid}" class="summary_tp" >
            <button id="backBtnTp_${this.config.uuid}" data-id="${this.config.uuid}" title="Mas Información" class="toggle" > &#187 </button>
            <div class="containerSummary" >
                ${filtros}
                <div id="infoSummary_${this.config.uuid}" class="content"></div>
            </div>
        </article>
        ${buttomRealTime}
        `;
        
        if($(`#container_filter_${this.config.uuid}`).length == 0){
            $(this.config.containerDomCanvas).prepend(dom);
        }
        
         /* Valido la accion del boton que ejecuta el tiempo real */
         $(`#btnRealTime_${this.config.uuid}`).click(function(e){
            var id = obj.uuid;
            if($(`#btnRealTime_${id}`).hasClass('active')){
                $(`#btnRealTime_${id}`).removeClass('active');
                $(`#btnRealTime_${id}`).prop('title','Down Real Time');
            }else{
                $(`#btnRealTime_${id}`).addClass('active');
                $(`#btnRealTime_${id}`).prop('title','Up Real Time');
            }
        });

         /* Valido la accion del boton que muestra el resumen */
         $(`#btnToggle_${this.config.uuid}`).click(function(e){
            var id = obj.uuid;
            if($(`#filter_tp_${id}`).hasClass('active')){
                $(`#filter_tp_${id}`).removeClass('active');
                $(this).html('Mostrar Filtros');
            }else{
                $(`#filter_tp_${id}`).addClass('active');
                $(this).html('Ocultar Filtros');    
            }
        });
        $(`#backBtnTp_${this.config.uuid}`).click(function(e){
            var id = obj.uuid;
            if($(`#container_filter_${id}`).hasClass('active')){
                $(`#container_filter_${id}`).removeClass('active');
                $(this).html('&#187'); 
            }else{
                $(`#container_filter_${id}`).addClass('active');
                $(this).html('&#171;');
            };
        });
        
        $(`#clean_${this.config.uuid}`).click(function(e){
            var id = obj.uuid;
            $('.filt').removeClass('filt');
            $(`#resultFilt${id}`).remove();
            /* Limpio la seleccion */
            resetSelection(obj,true);
        });
        
        
        

        $(`#frm_filterTp_${this.config.uuid}`).submit(function(e){
            e.preventDefault();
            let id = $(this).data('idfrm');
            search($(`#searchNode_${id}`).val(),$(`#searchNodeValue_${id}`).val(), nodos,obj, infoByNode );
        });

        /* Cargo el resumen de la TP */
        this.summaryNodes();
    };
    /* Muestra el contenedor que contienen el resumen de los nodos buscados o seleccionados */
    summaryNodes(){
        const obj = this.config;
        const allData = this.dataTP;
        /* Agrego las opciones al selector */
        
        if(typeof obj.showFilters === 'boolean' && obj.showFilters){
            /* Valido que esten habilitados los filtros */
            let filters = obj.filters;
            var options = [`<option value="" >-Seleccione-</option>`];
            for (let index = 0; index < filters.length; index++) {
                const element = filters[index];
                var op = `<option value="${element}" >${element}</option>`;
                options.push(op);
            }
            var tmpVal = $(`#searchNode_${this.config.uuid}`).val();
            $(`#searchNode_${this.config.uuid}`).html(options.join(''));
            if(tmpVal!=''){
                $(`#searchNode_${this.config.uuid}`).val(tmpVal);
            };
        };
        
        var size = Object.keys(allData).length;
        var ul = `<ul class="list_summary" id="list_summary${this.config.uuid}">
                    <li class="header"><h3>Resumen</h3></li>
                    <li>Total ${(typeof obj.titleNodeSummary == 'undefined') ? 'Nodos' : obj.titleNodeSummary }: <span>${ size }</span></li>
                  </ul>`;
        $(`#infoSummary_${this.config.uuid}`).html(ul);
    };
    /* Busca los nodos que contengan el valor filtrado en el formulario de busqueda */
    searhByFilterTp(key,value,nodos,config,infoByNode){

        const obj = config;

        $('.filt').removeClass('filt');
        if($(`#resultFilt${obj.uuid}`).length > 0){
            $(`#resultFilt${obj.uuid}`).remove();
        }
        const self_ = (new tp);
        let coincidencias = [];
        let coincidenciasIds = [];
        for (const i in nodos) {
            if (Object.hasOwnProperty.call(nodos, i)) {
                const element = nodos[i];
                if(key == 'id'){
                    if(element[key] == value){
                        coincidencias.push(element);
                        coincidenciasIds.push(element.id);
                    }
                }else if(element[key].indexOf(value) >= 0){
                    coincidencias.push(element);
                    coincidenciasIds.push(element.id);
                }
            }
        }

        var btnNext = ``;
        if(coincidencias.length > 0){
            btnNext = `<a class="btnNxtRes" title="Siguiente Coincidencia" data-id="${obj.uuid}" data-viewnode="0" id="nextResultFilt${obj.uuid}" >&#187 <small class="pn">1</small></a>`;
            /* Posicionamos el canvas en ralcion a los nodos */
            obj.dataTpCanvas.network.fit({
                nodes: coincidenciasIds,
                animation:true
            });
            /* selecciono los nodos que coincidad */
            self_.selectNode(obj, coincidenciasIds);

        }

        var li = `<li id="resultFilt${obj.uuid}">Coincidencias: <span class="filter">${coincidencias.length}</span> ${btnNext} </li>`;
        $(`#list_summary${obj.uuid}`).append(li);


        /* Eventos */
        $(`#nextResultFilt${obj.uuid}`).click(function(e){

            var nextpos = (parseInt($(this).data('viewnode')) + 1);
            
            if(nextpos >= coincidencias.length){
                nextpos = 0;
            }
            var dataNext = coincidencias[nextpos];
            $(this).data('viewnode',nextpos);
            $(`#${this.id} small`).html((nextpos + 1));
            infoByNode(dataNext, obj);

        });

        if(coincidencias.length > 0){
            /* Mostramos el resumen de la primera coincidencia sin seleccionar el nodo */
            infoByNode(coincidencias[0],obj,false);
        };

    };
    showListInfoByNode(data,_self){
        console.log(data)
        var li = [];
        console.log(data)
        for( var i in data){
            let str = data[i];
            if(i == 'status'){
                str = _self.statusNode(str)['label'];
            }else if(i == 'severity'){
                str = _self.statusSeverityNode(str)['label'];
            }

            var tmp = `<li><b>${i}:</b> <span>${ str}</span></li>`;

            if((new tp()).omiteKeys().indexOf(i) < 0){
                li.push(tmp);
            }
        }
        return li;
    }
    /* Muestra la informacion del nodo seleccionado */
    infoByNode(data,config,selectedNode=true){
        config.nodeVisibleInfo = data.id;
        const _self = new tp(config);
        var li = _self.showListInfoByNode(data,_self);
        var idUl = `infoNode_content_summary${config.uuid}`;
        var idContainer = `info_content_add_summary${config.uuid}`;
        var ul = `<ul class="list_summary detail" id="${idUl}">
                    <li class="header">
                    <marquee direction="down" scrollamount="2" loop="3">
                        <h3>Detalle - ${(typeof config.titleNodeSummary == 'undefined') ? '' : config.titleNodeSummary+' -' } ${ (config.label !== undefined ? data[config.label] : '' ) } </h3></li>
                    </marquee>
                  </ul>
                  <div id="${idContainer}" ></div>`;
        if($(`#${idUl}`).length > 0){
            $(`#${idUl}`).remove();
            $(`#${idContainer}`).remove();
        }
        $(`#infoSummary_${config.uuid}`).append(ul);

        if(selectedNode){
            /* Limpiamos los nodos y seteamos sus valores */
            _self.resetSelection(config);
            /* Seleccionamos el nodo filtrado */
            _self.selectNode(config,[data.id]);
            /* Enfocamos el Nodo dentro del canvas  */
            config.dataTpCanvas.network.focus([data.id],{
                scale: (config.scale !== undefined ? config.scale : 0.75),
                animation:true
            });
        }else{
            /* Lo movemos hacia el nodo */
            setTimeout(() => {
               /* Enfocamos el Nodo dentro del canvas  */
                config.dataTpCanvas.network.focus([data.id],{
                    scale: (config.scale !== undefined ? config.scale : 0.75),
                    animation:true
                }); 
            }, 1200);
        }
        /* Ejecutamos acciones personalizadas con  */
        config.infoByNode(
            _self,
            data,
            config,
            selectedNode,
            `#infoSummary_${config.uuid}`,
            `#${idContainer}`,
            li);
    };
    /* Limpial todos los nodos seleccionados */
    resetSelection(config,clean=false){
        /* Alteramos el canvas de la topologia */
		    config.dataTpCanvas.network.unselectAll();
        
        if(clean){
            /* Limpiamos el resumen */
            $(`#infoNode_summary${config.uuid}`).remove();

            config.dataTpCanvas.network.fit({
                animation:true
            })
        }
    };
    /* Selecciona un grupo de nodos especificos por sus ids y sus conexiones */
    selectNode(config,nodesId=[],focusEdgs=true){
        config.dataTpCanvas.network.selectNodes(nodesId,focusEdgs);
    };
    intervalUpdate(_self,config, nodes){
        const conn = config.serverInterval;
        const timer = (conn.time !== undefined ? (conn.time * 1000) : 5000 );
        const formData = new FormData();
        if(_self.nodes === undefined){
            /* La primera vez que ingresa tiene la facilidad de acceder a todos los atributos de la clase */
            _self.config = config;
            _self.config.incrementPost = 1;
        }
        
        if($(`#btnRealTime_${_self.config.uuid}`).hasClass('active')){
            if(typeof conn.data === "object"){
                for(var i in conn.data){
                    const element = conn.data[i];
                    if(typeof element === 'object'){
                        formData.append(i,JSON.stringify(element));
                    }else{
                        formData.append(i,element);
                    }
                }
                /* Anexo time */
                formData.append('updateTime', _self.config.lastUpdate.time );
                formData.append('updateTimeFormat', _self.config.lastUpdate.timeDate );
                formData.append('tpIds', _self.config.arrIdsTP.join(",") );
    
                _self.ajax(conn.url,formData,conn.method,(response)=>{
                    _self.config.incrementPost = _self.config.incrementPost + 1;
                    if(Object.keys(response).length > 0){
                        _self.config.lastUpdate = {
                            time : response.time,
                            timeDate : response.timeDate
                        };
                        /* Agregamos las nuevas fallas a las alertas del footer organizado por fecha */
                        config.dataTPFooter = _self.sort(config.dataTPFooter.concat(response.footer), 'update_time', 'asc');

                        _self.setAtributesNode(response.data, nodes)
                    }
                },false,'js');
            }else{
                _self.log("setIterval is not valid, please review configuration library","error");
            };
        }

        setTimeout(function(){
            _self.intervalUpdate(_self, config, nodes );
        }, timer );
    };
    setAtributesNode(nodesUpdate,nodesTP){
        Object.keys(nodesUpdate).map((id,i) => {
            var node = this.config.dataTpCanvas.network.body.nodes[id];
            var change = false;
            if(nodesUpdate[id]['status'] !== undefined){
                chagce = true;
                node.options.color.background = this.statusNode(nodesUpdate[id]['status'])['border'];
                node.options.status = nodesUpdate[id]['status'];
            };
            if(nodesUpdate[id]['faults'] !== undefined){
                change = true;
                node.options.faults = nodesUpdate[id]['faults'];
                node.options.number =  nodesUpdate[id]['number'];
                node.options.severity =  nodesUpdate[id]['max_severity'];
                node.options.color.border = this.statusSeverityNode(node.options.severity)['color'];
                
            };
            /* Efecto de Seleccion en el Nodo */
            node.options.color.highlight.border = node.options.color.border;
            node.options.color.highlight.background = node.options.color.background;
                    
            nodesTP.find((val,index) => {
                if(val.id === id ){
                    nodesTP[index]['faults'] = node.options.faults;
                    nodesTP[index]['status'] = node.options.status;
                    nodesTP[index]['number'] = node.options.number;
                    nodesTP[index]['severity'] = node.options.severity;
                }
            });

            if(change){
                node.setOptions(node.options);
                this.config.dataTpCanvas.network.startSimulation();
                if(this.config.nodeVisibleInfo == id){
                  nodesTP.find((val,index) => {
                    if(val.id === id ){
                        this.infoByNode(nodesTP[index],this.config,false);
                    }
                  });
                }
                this.config.dataTpCanvas.network.stopSimulation();
            };
        });
        
        /* Actualizamos contador del total de fallas */
        this.config.filters_severities = {
          total:0, 
          maxSeverity:null, 
          inputs : {
            5:0, /* Critico */
            4:0, /* Mayor */
            2:0 /* Precaucion */
          } 
        };
        
        nodesTP.find((val,index) => {
          if(val.number !== undefined){
            this.config.filters_severities['total'] += val.number;
          }
          if(val.max_severity !== undefined){
              this.config.filters_severities['maxSeverity'] = (this.config.filters_severities['maxSeverity'] < val.max_severity ? val.max_severity : this.config.filters_severities['maxSeverity'] );
          }

          if(val.faults !== undefined){
            for(const [k, v] of Object.entries(val.faults.severity) ){
              if(this.config.filters_severities['inputs'][k] !== undefined){
                this.config.filters_severities['inputs'][k] += v;
              }
            }
          }
        });
    };
    /* Anexo seccion del footer */
    showFooterInfo(){
        let idFooter = `#footer_tp${this.config.uuid}`
        let footer = `
        <div class='footer-tp' id="${idFooter.replace('#','')}">
            <div class="alerts-footer" data-total data-increment="0" ></div>
            <div class="severity-counts-footer"></div>
        </div>`;
        if(this.config.dataTPFooter){
            if(!this.existElm(idFooter)){
                $(`#${this.config.domId}`).after(footer);
            }
            this.intervalShowAlertsFooter();
            this.countSeveritiesFooter();
        };
    };
    intervalShowAlertsFooter(){
        if(this.config.dataTPFooter){
          let cajaFooter = `#footer_tp${this.config.uuid}`
          const eventsFooter = this.config.eventsFooter;
          const fault_active = this.config.dataTPFooter[0];
          
          const alertFoot = $(`<div class="alert"></div>`);
          
          // console.log(fault_active);
          if(this.existElm(cajaFooter) && fault_active && this.config.dataTPFooter.length >= 1 ){
            let nodeAlertInfo = (this.dataTP[fault_active['device']] ? this.dataTP[fault_active['device']] : {} );
            const smallDivisional = `<small style="font-size: 15px;font-weight: bold;margin: 0 1px;margin-left: 2px;color:${this.statusSeverityNode(fault_active['severity'])['color']}" > / </small>`;
            $(`${cajaFooter} .alerts-footer`).html(alertFoot);
            // this.statusSeverityNode(fault_active['severity'])['color']
            if(this.config['alertFooterActiva'] != undefined){
              let _n = this.config['alertFooterActiva'];
              // _n.setOptions({..._n.options, shape: "image"}); 
            }
            const node = this.config.dataTpCanvas.network.body.nodes[nodeAlertInfo['id']];
            const config = this.config;
            this.config['alertFooterActiva'] = node;
            // node.setOptions({...node.options, shape: "circularImage" });  
               
            
            let bodyAlert = `
            <span class="badge" style="background-color:${this.statusSeverityNode(fault_active['severity'])['color']}" ></span>
            <span class="label">
              ${fault_active['lastdate']} 
                ${smallDivisional}
              ${nodeAlertInfo['ip']} 
                ${smallDivisional}
              ${nodeAlertInfo['title']} 
                ${smallDivisional}
              ${fault_active['summary']}
            </span>
            `;
            $(alertFoot).append(bodyAlert);
            alertFoot.click(function(){
                let nodo = properties.nodes;
                let infoNode = nodes.get(nodo);
                infoByNode(infoNode[0],config,true);
                $(`#container_filter_${objDom.uuid}`).removeClass('active');
                $(`#backBtnTp_${objDom.uuid}`).click();

                eventsFooter('alert_footer', {...fault_active, config: config})
            });
            alertFoot.css('box-shadow', `0px 0px 5px 2px ${this.statusSeverityNode(fault_active['severity'])['color']} inset`);
            alertFoot.addClass('active');
            console.log("Pinto alerta ----");
            /* Selecciono el nodo que esta siendo afectado por esta falla */
            
          }
          if(this.config.dataTPFooter.length > 0){
              /* 
              Elimino las posiciones hasta que llegue a la ultima del arreglo
              y cuando llegue la ultima la mantenemos hasta que el array cambié
              */
              this.config.dataTPFooter.shift();
          }
          
        }
      if($(`#btnRealTime_${this.config.uuid}`).hasClass('active')){
        this.countSeveritiesFooter();
      }  
      
      if(typeof this.config.serverInterval == 'object'){
        setTimeout(() => {
          this.intervalShowAlertsFooter()
        }, 1500);
      }
        
    };
    countSeveritiesFooter(){
      const cajaFooter = `#footer_tp${this.config.uuid}`
      const config = this.config;
      $(`${cajaFooter} .severity-counts-footer`).empty();
      const createCaja = (obj) => {

          const totalFaults = $(`<div class="cja-total" id="${obj.id}"  ></div>`);
          $(`${cajaFooter} .severity-counts-footer`).append(totalFaults);
          $(totalFaults).append(obj.label);

          /* Evento de click */
          totalFaults.click(function(){
            config.eventsFooter(obj.type, {...obj, config: config })
          });
      }

      let tabsFooter = [
        {
          id:'critical_tab_' + config.uuid,
          type:'severity',
          severity:"5",
          cant:this.config.filters_severities.inputs[5],
          label :`<span class="badge" style="background-color:${this.statusSeverityNode('5')['color']}" ></span> 
                  <span class="label">Crítico <b>${this.config.filters_severities.inputs[5]}</b></span>`
        },
        {
          id:'mayor_tab_' + config.uuid,
          type:'severity',
          severity:"4",
          cant:this.config.filters_severities.inputs[4],
          label :`<span class="badge" style="background-color:${this.statusSeverityNode('4')['color']}" ></span> 
                  <span class="label">Mayor <b>${this.config.filters_severities.inputs['4']}</b></span>`
        },
        {
          id:'precaucion_tab_' + config.uuid,
          type:'severity',
          severity:"2",
          cant:this.config.filters_severities.inputs[2],
          label :`<span class="badge" style="background-color:${this.statusSeverityNode('2')['color']}" ></span> 
                  <span class="label">Precaucion <b>${this.config.filters_severities.inputs['2']}</b></span>`
        },
        /* 
        * Por ahora no se necesita mostrar
        {
          id:'total_tab_' + config.uuid,
          type:'critica_total',
          label :`<span class="badge" style="background-color:${this.statusSeverityNode('')['color']}" ></span> 
                  <span class="label">Total <b>${this.config.filters_severities.total}</b></span>`
        },
         */
      ].map((k) => {
        return createCaja(k)
      }); 
    };

};


/* 
--------------------------------------------------------------------
Fin del objeto que construye el diagrama de Topología en estrella
Genero la extension de jquery sobre el objeto
--------------------------------------------------------------------
*/
$.fn.topology = function(obj){
    obj.domId = `${$(this).prop('id')}`;
    obj.uuid = new Date().getTime();
    $(obj.domId).data('uuid', obj.uuid);
    (new tp(obj,true));
};