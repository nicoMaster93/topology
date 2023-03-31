/* 
--------------------------------------------------------------------------------------------
Fecha creación 2021-05-26
Creado por Juan Nicolas Hernandez Duque
Plugin de Diagrama de topologia en cascada
Para el correcto funcionamiento se debe incluir los archivos de topology.css, jquery.js y drag.jquery.js
Commits:
---------------------
Version 1.0.2       |
---------------------
2022-11-18 Se agrega la clase de la imagen segun el tipo de la data
2023-02-07 Se agrega la opcion de relacionar hermanos, Comentarios identificadores TAGS [v1_SBL, v1_PRNS]
--------------------------------------------------------------------------------------------
*/

function encode(str){
    var resp = '';
    if(typeof str === 'string'){
        resp = window.btoa(str);
    } else if(typeof str === 'object'){
        resp = window.btoa(JSON.stringify(str));
    }
    return resp;
}
function decode(str){
    var resp = window.atob(str);
    var filt = "{}";
    var n = filt.localeCompare(resp);
    if(n >= 0){
        /* Is object */
        resp = JSON.parse(resp);
    }
    return resp;
}
var imgHostname = `./css/logoEsol.png`;
function loading(containerLoading="body", hidden = false,logo=false){
    if(logo!=false){
        imgHostname = logo;
    }
    if($("#containerLoading").length == 0 ){
        var htmlLoading = $('<div class="containerLoading in" id="containerLoading"></div>');
        htmlLoading.html('<div class="doubleLine"> <div></div> <div></div> <div> <div></div> </div> <div> <div></div> </div> <div class="imgCenter"> <img src="'+imgHostname+'"></div></div>');
		$(containerLoading).append(htmlLoading);
		if(hidden == true){
			$("#containerLoading").removeClass('in');
			setTimeout(function(){
				$("#containerLoading").remove();
			},500);
		}
    }else{
        $("#containerLoading").removeClass('in');
        setTimeout(function(){
            $("#containerLoading").remove();
        },500);
    }
}
/* 
-------------------------------------------------------------
Final de funciones generales usadas en el objeto topolgia 
-------------------------------------------------------------
*/
var topology = {
    elementID:{},
    domlastActiveTp:false,
    endtopology:{},
    interval_tp:{}, /* contiene el intervalo de tiempo que valida si ya finalizo de cargar todos los nodos de la topologia */
    reservedKeys: ['containerNodeTp', 'containerParentTp', 'levelTp', 'parent', 'posicionObject','viewDetail','data'],
    paddingLeft:35,
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
                }
				if(typeof funcion != 'undefined'){
					funcion(data);
				}
			},
			error: function(data){
				if(typeof erno == 'function'){
                    erno(data);
                }
			}
		});
	},
    log_error:function(error){
        let obj  = this.elementID[this.domlastActiveTp];
        if(typeof obj.showConsole == 'boolean' && obj.showConsole){
            console.error(error);
        }
    },
    setAttributes(attr){
        let id = $(attr.element).data('idtopology');
        let obj  = this.elementID[id];
        for(var i in attr){
            if(typeof obj[i] !== 'undefined'){
                this.elementID[id][i] = attr[i];
            }
        }
    },
    ini(obj={}){
        if(typeof obj.element != 'undefined'){
            if($(obj.element).length > 0){
                /* uuid */
                obj.timestamp_tp = new Date().getTime();
                $(obj.element).addClass("containerTopology");
                var imgLoader = (typeof obj.imgLoader != 'undefined' && obj.imgLoader != false ? obj.imgLoader : false )
                loading(obj.element,false,imgLoader);
                this.createObjectElement(obj);
            }else{
                this.log_error("No existe el elemento DOM de topologia");
            }
        }else{
            this.log_error("No se reconoce el id del elemento");
        }
    },
    createObjectElement(obj){
        this.domlastActiveTp = obj.timestamp_tp;
        this.elementID[this.domlastActiveTp] = obj;
        $(obj.element).data("idtopology", obj.timestamp_tp );
        this.getDataTopology()
    },
    getDataTopology(){
        let obj  = this.elementID[this.domlastActiveTp];
        /* Obtengo el json segun la url proporcionada */
        if(typeof obj.url != "undefined"){
            let formData = new FormData();
		    /* Valido si se envian variables por ajax */
            if(typeof obj.post != "undefined"){
                if(typeof obj.post === "object"){
                    for(var i in obj.post){
                        const element = obj.post[i];
                        if(typeof element === 'object'){
                            formData.append(i,JSON.stringify(element));
                        }else{
                            formData.append(i,element);
                        }
                    }
                }else{
                    this.log_error("post debe ser de tipo object");
                }
            }
            this.ajax(obj.url,formData,obj.method,(resp)=>{
                var txtJson = JSON.stringify(resp);
                this.endtopology[this.domlastActiveTp] = [];
                this.elementID[this.domlastActiveTp]['dataTopology'] = resp;
                this.elementID[this.domlastActiveTp]['totalNodes'] = 0;
                this.elementID[this.domlastActiveTp]['totalNodesTmp'] = (txtJson.split("title").length - 1);
                this.generateDOM_topology(resp);
            },false,'js');
        }else if(typeof obj.data == "object"){
            var txtJson = JSON.stringify(obj.data);
            this.endtopology[this.domlastActiveTp] = [];
            this.elementID[this.domlastActiveTp]['dataTopology'] = obj.data;
            this.elementID[this.domlastActiveTp]['totalNodes'] = 0;
            this.elementID[this.domlastActiveTp]['totalNodesTmp'] = (txtJson.split("title").length - 1);
            this.generateDOM_topology(obj.data);
        }else{
            this.log_error("No hay Registros para mostrar");
        }
    },
    containerGraphicTp(){
        /* Creo los layouts que van a contener las 2 vistas; en la parte superior el general y en el inferior el especifico  */
        let obj  = this.elementID[this.domlastActiveTp];
        var sectionDetail = ``;
        var filtros = ``;
        var sectionCss = `style="height: 95%!important;"`;
        if(typeof obj.showDetail == 'boolean' && obj.showDetail==true){
            sectionCss = ``;
            sectionDetail = `<section class="tp_layout detail" id="tp_layout_deta_${this.domlastActiveTp}">
                                <svg id="tp_svg_detail_${this.domlastActiveTp}" height="100%" width="100%"></svg>
                                <ul id="tp_view_detail_${this.domlastActiveTp}" class="tp_graph"> </ul>
                            </section>`;
        }
        /* Finalizo de validar si se va mostrar el detalle de la topologia  */
        /* Valido si el objeto viene con filtros */
        if(typeof obj.showFilters == 'boolean' && obj.showFilters==true){
            filtros = `
            <button id="btnToggle_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}" title="Mas Información" class="toggleFilter" > Mostrar Filtros </button>
            <div class="filter_tp" id="filter_tp_${this.domlastActiveTp}" >
                            <div class="inputs">
                                <form autocomplete="off" id="frm_filterTp_${this.domlastActiveTp}" data-idfrm="${this.domlastActiveTp}">
                                    <label for="searchNode_${this.domlastActiveTp}">Buscar por:</label>
                                    <select id="searchNode_${this.domlastActiveTp}" name="searchNode" required></select>
                                    <input type="text" name="filter_txt" id="searchNodeValue_${this.domlastActiveTp}" placeholder="Escribe aquí" autocomplete="off" required>
                                    <button type="submit">Buscar</button>
                                    <button type="reset" id="clean_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}">Limpiar</button>
                                </form>
                            </div> 
                       </div>
                       <hr>`;
        }
        // ${!obj.showDetail ? 'detail active' : 'principal'}
        var dom = `<div class="tp_container" id="tp_container_${this.domlastActiveTp}" style="margin-left: ${this.paddingLeft}px; width: calc(100% - ${(this.paddingLeft - 10)}px); ">
                    <article id="summary_tp_${this.domlastActiveTp}" class="summary_tp" >
                        <button id="backBtnTp_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}" title="Mas Información" class="toggle" > &#187 </button>
                        <div class="containerSummary" >
                            ${filtros}
                            <div id="infoSummary_${this.domlastActiveTp}" class="content"></div>
                        </div>
                    </article>
                    <section  ${sectionCss} class="tp_layout principal " id="tp_layout_gen_${this.domlastActiveTp}" >
                        <svg id="tp_svg_general_${this.domlastActiveTp}" height="100%" width="100%"></svg>
                        <div class="scale">
                            <div id="tp_view_general_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}" class="tp_graph"> </div>
                        </div>
                    </section>
                    ${sectionDetail}
                 </div>`;
        $(obj.element).append(dom);

        /* Valido la accion del boton que muestra el resumen */
        $(`#btnToggle_${this.domlastActiveTp}`).click(function(e){
            var id = $(this).data('id');
            if($(`#filter_tp_${id}`).hasClass('active')){
                $(`#filter_tp_${id}`).removeClass('active');
                $(this).html('Mostrar Filtros');
            }else{
                $(`#filter_tp_${id}`).addClass('active')
                $(this).html('Ocultar Filtros');    
            }
        });
        $(`#backBtnTp_${this.domlastActiveTp}`).click(function(e){
            var id = $(this).data('id');
            if($(`#summary_tp_${id}`).hasClass('active')){
                $(`#summary_tp_${id}`).removeClass('active');
                $(this).html('&#187'); 
            }else{
                $(`#summary_tp_${id}`).addClass('active')
                $(this).html('&#171;');
            }
        });
        $(`#clean_${this.domlastActiveTp}`).click(function(e){
            var id = $(this).data('id');
            $('.filt').removeClass('filt');
            $(`#resultFilt${id}`).remove();
        });
        $(`#frm_filterTp_${this.domlastActiveTp}`).submit(function(e){
            e.preventDefault();
            let id = $(this).data('idfrm')
            topology.domlastActiveTp = parseInt(id);
            topology.searhByFilterTp($(`#searchNode_${id}`).val(),$(`#searchNodeValue_${id}`).val());
        });

        let id_loyout = { 
            gen: `#tp_view_general_${this.domlastActiveTp}`, 
            deta: `#tp_view_detail_${this.domlastActiveTp}`
        };
        return id_loyout;
    },
    generateDOM_topology(data,detail=false){
        let obj = this.elementID[this.domlastActiveTp];
        var size = Object.keys(data).length;
        if(size > 0){
            var containers = this.containerGraphicTp();
            var ulContainer = (detail ? containers.deta : containers.gen);
            var prefixLayout = (detail ? 'deta_' : 'pri_');
            /* Recorro el json e inicio a crear los primeros nodos */
            this.call_node_generated(prefixLayout,ulContainer,data,data.length);
        }else{
            this.log_error("No hay registros para mostrar");
            $(obj.element).html("<p>No hay registros para mostrar</p>");
            loading(obj.element,true);
        }
    },
    call_node_generated(prefixLayout,domContainer,data,count,pos=0,level=0,scale=null){
        let obj = this.elementID[this.domlastActiveTp];
        /* Valido si hay un tope maximo de niveles */
        console.log(obj,prefixLayout,domContainer,data,count,pos,level,scale);
        let total = 0;
        for(let i in data){
            const element = data[i];
            this.createNode(element,prefixLayout,domContainer,total)
            total++;
        }
        console.log(total);
        let beginSnake = Object.keys(data)[0];
        /* Finaliza de crear los nodos */
        
        // this.organizeNodes(beginSnake, data);
        this.organizeNodes(24, data);
        loading(obj.element,true);


    },
    /* 2022-11-18 Se agrega la clase de la imagen segun el tipo de la data */
    classNodeByType(type){
        var clss = null;
        switch (type) {
            case "FIREWALL":
                clss = `icon-topo icon-firewall_1`;
            break;
            case "ROUTER":
                clss = `icon-topo icon-router_1`;
            break;
            case "SW":
                clss = `icon-topo icon-sw_1`;
            break;
            case "SWITCH":
                clss = `icon-topo icon-sw_1`;
            break;
            case "WIRELESS CONTROLLER":
                clss = `icon-topo icon-wl_1`;
            break;
            case "COOLING":
                clss = `icon-topo icon-cooling_1`;
            break;
            case "UPS":
                clss = `icon-topo icon-ups_1`;
            break;
            case "RADIOS":
                clss = `icon-topo icon-radio_1`;
            break;
            case "Rectificadores":
                clss = `icon-topo icon-rectificator_1`;
            break;
            case "ACCESS POINT":
                /* Icono Pendiente */
                clss = `icon-topo icon-rectificator_1`;
            break;
        }
        return clss;
    },
    statusNode(status){
        let obj = this.elementID[this.domlastActiveTp];
        var chng = false;
        var rtn = {};
        switch (status){
            case '-1':
                chng = true;
                // rtn = {style: "background-color: #d66cd6; color: white;", label : "never seen"};
                rtn = {style: "border:1px solid #d66cd6; color: white;", label : "never seen"};
                rtn['filter'] = "filter: invert(0.5) sepia(1) hue-rotate(250deg)";
            break;
            case '0':
                chng = true;
                // rtn = {style: "background-color: #4dd04d; color: white;", label : "Ok"};
                rtn = {style: "border:1px solid #4dd04d; color: white;", label : "Ok"};
                rtn['filter'] = "filter: invert(0.5) sepia(1) hue-rotate(90deg) saturate(1000%)";
            break;
            case '1':
                chng = true;
                // rtn = {style: "background-color: red; color: white;", label : "Down"};
                rtn = {style: "border:1px solid red; color: white;", label : "Down"};
                rtn['filter'] = "filter: invert(0.5) sepia(1) hue-rotate(320deg) saturate(1000%)";
            break;
            case '2':
                chng = true;
                // rtn = {style: "background-color: #ffa400; color: white;", label : "Snmp Down"};
                rtn = {style: "border:1px solid #ffa400; color: white;", label : "Snmp Down"};
                rtn['filter'] = "filter: invert(0.5) sepia(1) hue-rotate(5deg) saturate(1000%)";
            break;
        }
        if(!chng){
            rtn = null;
        }
        return rtn;
    },
    organizeNodesPemding(obj,allData){
        console.log(obj);
        const json = allData[obj];
        let au = 0;
        for(var i in json){
            const elm = json[i];
            debugger; 
            /* Se recorre la posicion de los Padres [obj.parent] */
            if(typeof elm.parent !== "undefined"){
                const arr_parent = elm.parent ? elm.parent : [] ;
                arr_parent.forEach(element => {
                    var n = json[element];
                    // this.moveNode(n,au);
                });
            }
            /* Se recorre la posicion de los Hermanos [obj.sibling] */
            if(typeof elm.sibling !== "undefined"){
                const arr_sibling = elm.sibling ? obj.sibling : [] ;
            }
            /* Se recorre la posicion de los hijos [obj.children] */
            if(typeof elm.children !== "undefined"){
                const arr_children = elm.children ? elm.children : [] ;
                arr_children.forEach(element => {
                    var n = json[element];
                    this.moveNode(elm,n,au);
                });
            }
            // this.moveNode(json[i],au);
            au++;
        }
        return

    },
    organizeNodes(obj,allData){
        let arregloFinal = this.endtopology[this.domlastActiveTp];
        let total = Object.keys(allData).length;
        let posicionActual = Object.keys(allData).indexOf(`${obj}`);
        /* voy sumando una posicion hasta llegar al final del arreglo */
        let nextObject = ( posicionActual + 1 );
        let noChange = true;
        const elm = allData[obj];
        
        let arr_parent = arr_children = arr_sibling = [];

        if(typeof elm.parent !== "undefined"){
            noChange = false;
            arr_parent = elm.parent
        }
        if(typeof elm.children !== "undefined"){
            noChange = false;
            arr_children = elm.children;
        }
        if(typeof elm.sibling !== "undefined"){
            noChange = false;
            arr_sibling = elm.sibling;
        }
        /* Sanetizamos los arreglos */
        arr_children = [...arr_children, ...arr_parent.filter(i => !arr_parent.includes(i))]
        arr_sibling = [...arr_sibling, ...arr_parent.filter(i => !arr_sibling.includes(i))]
        arr_sibling = [...arr_sibling, ...arr_parent.filter(i => !arr_sibling.includes(i))]
        

        var au = 0;
        arr_parent.forEach(element => {
            var n = allData[element];
            this.moveNode(n,elm,'P',au,(resp)=>{
                this.log_error(resp)
                if(resp.next){
                    this.organizeNodes(element,allData)
                }
            });
            au++;
        });
        

        /* Se recorre la posicion de los hijos [obj.children] */
        var au = 0;
        arr_children.forEach(element => {
            var n = allData[element];
            this.moveNode(elm,n,'C',au,(resp)=>{
                this.log_error(resp)
                if(resp.next){
                    this.organizeNodes(element,allData)
                }
            });
            au++;
        });
        

        /* Se recorre la posicion de los hermanos [obj.sibling] */
        var au = 0;
        arr_sibling.forEach(element => {
            var n = allData[element];
            this.moveNode(elm,n,'S',au,(resp)=>{
                this.log_error([resp,n])
                if(resp.next){
                    this.organizeNodes(element,allData)
                }
            });
            au++;
        });

        
        if((nextObject < total) && noChange ){
            let snake = Object.keys(allData)[nextObject];
            this.organizeNodes(snake,allData)
        }
        // this.moveNode(json[i],au);

    },
    
    /* Creamos los nodos en la hoja */
    createNode(data,prefixLayout,recipienteNodes,scale=0,move=false){
        // debugger
        var statusNde = imgCssNde = labelNode = "";
        /* obj.dataTopology  => Contiene todo el arreglo de Nodos  */
        var obj = this.elementID[this.domlastActiveTp];
        
        /* Validamos si viene un arreglo de hijos */
        if(data.status){
            objStatus = this.statusNode(String(data.status));
            if(objStatus != null){
                statusNde = ` style="${objStatus.style}" title="Estado ${objStatus.label}" `;
            }
        }
        if(data.type){
            claseNode = this.classNodeByType(String(data.type));
            if(claseNode != null){
                imgCssNde = ` class="${claseNode}" style="${objStatus.filter}"`;
            }
        }

        var idContainerNodes = `${data.id}`;
        var node = `<li  
                        id="parent_li_${idContainerNodes}" 
                        class="li_tp_node">
                            <div ${statusNde} 
                                data-idnode="${data.id}" 
                                data-uuid-commun="${this.domlastActiveTp}" 
                                data-prefix="${prefixLayout}" 
                                data-lvl="${scale}" 
                                data-move="${move}" 
                                data-parents="[]"
                                onmousedown="topology.iniPress()" 
                                onmouseup="topology.actionsByNode(this,'${prefixLayout}',event)" 
                                id="node_${idContainerNodes}" 
                                class="tp_node "><!-- .not-child quita conector inferior -->
                                    <span ${imgCssNde} >${labelNode}</span>
                            </div> 
                    </li>`;  
        
        node = $(node);
        if(move){
            return node;
        }
        $(recipienteNodes).append(node); 
    },
    
    
    moveNode(dataParent,dataNode,type,index,callback){
        const node_element = $(`[data-idnode="${dataNode.id}"]`).filter( function(index){
            if ($(this).attr('id').indexOf(dataNode.id) != -1) 
                return $(this);
        });
        // const infoNode = $(node_element).data();
        // if(!infoNode.move){}

            /* Extraemos la copia del contenedor del nodo  */
            var moveLiElement = $(node_element).parent(); 
            /* Extraemos la copia del nodo  */
            var moveElement = $(node_element);
                moveElement.data('move',true);
                
                
            if(this.endtopology[this.domlastActiveTp].indexOf(dataNode.id) < 0){

                const prefixLayout = $(node_element).data('prefix');
                const recipienteNodes = `group_${dataParent.id}`;
                
                if($(`#${recipienteNodes}`).length == 0){
                    switch (type) {
                        case 'P':
                            /* Padres */
                            $(`#parent_li_${dataParent.id}`).append($(`<div id="${recipienteNodes}" data-padre-id="${dataParent.id}" class="up" ></div>`));    
                        break;
                        case 'C':
                            /* Hijos */
                            $(`#parent_li_${dataParent.id}`).append($(`<div id="${recipienteNodes}" data-padre-id="${dataParent.id}" class="down" ></div>`));    
                        break;
                        case 'S':
                            /* Hermanos */
                            $(`#parent_li_${dataParent.id}`).append($(`<div id="${recipienteNodes}" data-padre-id="${dataParent.id}" class="right" ></div>`));    
                        break;
                    }
                    
                }

                if($(`#${recipienteNodes}`).append( moveLiElement )){
                    /* Eliminamos el original */
                    // $(`[data-idnode="${dataNode.id}"]`).filter( function(index){
                    //     if ($(this).attr('id').indexOf(dataNode.id) != -1) 
                    //         return $(this);
                    // });
                    console.log( $(node_element).parent() );
                    this.endtopology[this.domlastActiveTp].push(dataNode.id);
                    callback({ next:true,moved:this.endtopology[this.domlastActiveTp].length });
                }
            }else{
                callback({ next:false,moved:this.endtopology[this.domlastActiveTp].length });
            };
    },
    /* 
     Funciones para los Eventos
    */

    iniPress(){
        return this.elementID[this.domlastActiveTp].pressIni = new Date();
    },
     actionsByNode(nodo,prefix,clk=null){
        var nodoId = '#'+nodo.id;
        const obj  = this.elementID[$(nodoId).data('uuid-commun')];
        const data =  obj.dataTopology;
        const elementData = $(nodoId).data();
        const info_node = data[ $(nodoId).data('idnode') ];
        this.log_error([info_node, elementData])
        /*Cuando se deje de hacer clic*/
        
        var startTime = obj.pressIni;
        endTime = new Date();
        var timeDiff = endTime - startTime; //en ms
        if(isNaN(timeDiff)){
            timeDiff = 0;
        }
        // console.log("Tiempo transcurrido:\n" + timeDiff + " ms");

        /* valido si es click o click sostenido ms */
        if(timeDiff < 115){
            /* Seteo el loader por el que el venga en el objeto topology */
            /* Detecto si el click o click derecho */
            if(clk == null || clk.which == 1){
                /* Si es click izquierdo o no viene evento de click */
                topology.log_error(['es click izquierdo', info_node]);
            }else if(clk.which == 3){
                topology.log_error('es click derecho');
                obj.onclickRightNode(nodoId, info_node);
                if(prefix==='deta_'){
                    document.getElementById(nodo.id).oncontextmenu = new Function("return false");;
                }
            }

        }else{
            var lines = document.querySelectorAll('line');
            for (let index = 0; index < lines.length; index++) {
                const element = lines[index];
                document.getElementById(element.id).setAttribute('style',`stroke:gray;stroke-width:1`);
            }
            topology.createLinesPP(`#${nodo.id}`,prefix,true, 'stroke:red;stroke-width:1');
            this.log_error(["Sostenido"])
        }
        
    },
}

/* 
--------------------------------------------------------------------
Fin del objeto que construye el diagrama de Topología en cascada
Genero la extension de jquery sobre el objeto
--------------------------------------------------------------------
*/
$.fn.topology = function(obj){
    obj.element = `#${$(this).prop('id')}`;
    if(typeof $(obj.element).data('idtopology') !== 'undefined'){
        topology.setAttributes(obj)
    }else{
        topology.ini(obj);
    }
};
