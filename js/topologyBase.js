/* 
--------------------------------------------------------------------------------------------
Fecha creación 2021-05-26
Creado por Juan Nicolas Hernandez Duque
Plugin de Diagrama de topologia en cascada
Para el correcto funcionamiento se debe incluir los archivos de topology.css, jquery.js y drag.jquery.js
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
    endtopology:false,
    interval_tp:null, /* contiene el intervalo de tiempo que valida si ya finalizo de cargar todos los nodos de la topologia */
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
                this.elementID[this.domlastActiveTp]['dataTopology'] = resp;
                this.elementID[this.domlastActiveTp]['totalNodes'] = 0;
                this.generateDOM_topology(resp);
            },false,'js');
        }else if(typeof obj.data == "object"){
            this.elementID[this.domlastActiveTp]['dataTopology'] = obj.data;
            this.elementID[this.domlastActiveTp]['totalNodes'] = 0;
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
            filtros = `<div class="filter_tp" id="filter_tp_${this.domlastActiveTp}" >
                            <div class="inputs">
                                <form autocomplete="off" id="frm_filterTp_${this.domlastActiveTp}" data-idfrm="${this.domlastActiveTp}">
                                    <label for="searchNode_${this.domlastActiveTp}">Buscar por:</label>
                                    <select id="searchNode_${this.domlastActiveTp}" name="searchNode" required></select>
                                    <input type="search" name="filter_txt" id="searchNodeValue_${this.domlastActiveTp}" placeholder="Escribe aquí" autocomplete="off" required>
                                    <button type="submit">Buscar</button>
                                    <button type="reset" id="clean_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}">Limpiar</button>
                                </form>
                            </div> 
                       </div>
                       <hr>`;
        }
        var dom = `<div class="tp_container" id="tp_container_${this.domlastActiveTp}">
                    <article id="summary_tp_${this.domlastActiveTp}" class="summary_tp" >
                        <button id="backBtnTp_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}" title="Mas Información" class="toggle" > &#187 </button>
                        <div class="containerSummary" >
                            ${filtros}
                            <div id="infoSummary_${this.domlastActiveTp}" class="content"></div>
                        </div>
                    </article>
                    <section  ${sectionCss} class="tp_layout principal" id="tp_layout_gen_${this.domlastActiveTp}" >
                        <svg id="tp_svg_general_${this.domlastActiveTp}" height="100%" width="100%"></svg>
                        <ul id="tp_view_general_${this.domlastActiveTp}" data-id="${this.domlastActiveTp}" class="tp_graph scale"> </ul>
                    </section>
                    ${sectionDetail}
                 </div>`;
        $(obj.element).append(dom);

        /* Valido la accion del boton que muestra el resumen */
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
    endProcedure:false,
    toplogyIsEndUpload(prefix,callback){
        this.interval_tp = setInterval(() => {
            if(this.endtopology){
                window.clearInterval(this.interval_tp);
                this.summaryNodes();
                callback(true);
                setTimeout(() => {
                    /* Envio al usuario al primer nodo */
                    let obj  = this.elementID[this.domlastActiveTp];
                    var container = (prefix == 'deta_' ? `#tp_layout_deta_${this.domlastActiveTp}` : `#tp_layout_gen_${this.domlastActiveTp}` );
                    var center = ( $($('.tp_node')[0]).offset().left - ($(window).width() / 2) )
                    $(container).scrollTop(0).scrollLeft( center );
                    loading(obj.element,true);
                }, 100);
            }else{
                this.log_error(['sigue cargando la topología']);
            }
        }, 1000);
    },
    generateDOM_topology(data,detail=false){
        let obj = this.elementID[this.domlastActiveTp];
        if(data.length > 0){
            var containers = this.containerGraphicTp();
            var ulContainer = (detail ? containers.deta : containers.gen);
            var prefixLayout = (detail ? 'deta_' : 'pri_');
            /* Recorro el json e inicio a crear los primeros nodos */
            this.call_node_generated(prefixLayout,ulContainer,data,data.length);
            this.toplogyIsEndUpload(prefixLayout,(resp)=>{
                this.log_error('finalizo la carga de la topologia');
                this.drawLinesTp(false,prefixLayout); 
            });
        }else{
            this.log_error("No hay registros para mostrar");
            $(obj.element).html("<p>No hay registros para mostrar</p>");
            loading(obj.element,true);
        }
    },
    drawLinesTp(especificNode=false,prefix){
        var containerNodes = (prefix == 'deta_' ? `#tp_view_detail_${this.domlastActiveTp}` : `#tp_view_general_${this.domlastActiveTp}` )
        var totalNodos = $(`${containerNodes} .tp_node`);
        var ini = 1;
        var colorLine = false;
        if(especificNode!=false){
            colorLine = 'stroke:red;stroke-width:1';
            if(especificNode!=false && $(`#parent_${especificNode}`).parents('li').length > 0){
                this.createLinesPP(`#${especificNode}`,$(`#${especificNode}`).data('prefix'),true,colorLine);
                if($(`#parent_${especificNode}`).find($('li.li_tp_node')).length > 0){
                    ini = 0;
                    var totalNodos = $(`#parent_${especificNode}`).find($('li.li_tp_node'));
                }else{
                    return;
                }    
            }
        }

        for (let index = ini; index < totalNodos.length; index++) {
            const element = totalNodos[index];
            var prefix = $(element).data('prefix');
            var nodoId = '#'+element.id;
            this.createLinesPP(nodoId,prefix,false,colorLine);
            
        }
    },
    call_node_generated(prefixLayout,domContainer,data,count,pos=0,level=0,scale=null){
        let obj = this.elementID[this.domlastActiveTp];
        /* Valido si hay un tope maximo de niveles */
        if(typeof obj.showDetail == 'boolean'){
            if(prefixLayout == 'deta_' && typeof obj.maxLevelDetail != 'undefined'){
                if(level >= obj.maxLevelDetail && obj.maxLevelDetail!=false){
                    return;
                }
            }
        }
        if(pos < count){
            this.endtopology = false;
            var element = data[pos];
            element.containerParentTp = (typeof element.containerParentTp == 'undefined' ?  domContainer : element.containerParentTp);
            element.levelTp = (typeof element.levelTp == 'undefined' ?  level : element.levelTp);
            element.posicionObject = (typeof element.posicionObject == 'undefined' ?  pos : element.posicionObject);
            totalNodosHijos = (typeof element.children == 'object' && element.children.length > 0) ? element.children.length : 0;
            totalNodosBrothers = 0; /* Lo inicio en 0 ya que a partir de este momento se empezaran a crear todos los nodos hijos de esta posicion */
            if(data.jump){
                element.jump=true;
            }
            this.createNode(element,element,prefixLayout,scale);
        }else{
            this.endtopology = true;
        }
        setTimeout(() => {
            if(pos < count){
                pos++; 
                this.endtopology = false;
                this.call_node_generated(prefixLayout,domContainer,data,count,pos,level,scale)
            }else if(pos == count){
                delete data.jump;
            }
        }, 100);
    },
    assigneDataNode(data){
        var resp = {};
        for(var i in data){
            if(i!= 'children'){
                resp[i] = data[i]
            }
        }
        return resp;
    },
    cleanDataNode(data){
        /* Setea el arreglo y lo devuelve a su origen */
        var resp = [];
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            var res = {};
            for(var i in element){
                if(i!= 'containerNodeTp' && i != 'containerParentTp'){
                    res[i] = element[i]
                }
            }
            resp.push(res);
            
        }
        return resp;
    },
    createNode(dataBase,data,prefixLayout,scale,lvl=1){
        var obj = this.elementID[this.domlastActiveTp];
       /* Valido si debo saltar la primera posicion */
        if(typeof data.jump == 'boolean'){
            scale = null;
        }
        /* Validamos si viene un arreglo de hijos */
       var tmpData = this.assigneDataNode(data);
       var encodeData = encode(tmpData); 
        var postionId = (scale == null ? data.posicionObject : `${data.posicionObject}_${scale}`  );
        var idContainerNodes = `${prefixLayout}containerNode_${data.levelTp}_${postionId}_${this.domlastActiveTp}`;
        var recipienteNodes = (typeof data.containerNodeTp !='undefined') ? data.containerNodeTp : data.containerParentTp;
        var dataParentNode = (typeof data.containerNodeTp !='undefined') ? data.containerNodeTp : '';
        var statusNde = "";
        if(typeof data.status != ""){
            objStatus = this.statusNode(data.status);
            if(objStatus != null){
                statusNde = ` style="${objStatus.style}" title="Estado ${objStatus.label}" `;
            }
        }
        /* Inicio || Label del nodo segun su contenedor */
        var labelNode = `E`;
        if(prefixLayout == 'pri_'){
            labelNode = ( typeof data.title != 'undefined' && data.title != null ? data.title.substring(0,1) : 'E');
        }else if(prefixLayout == 'deta_'){
            labelNode = ( typeof data.title != 'undefined' ? data.title : '');
            if(typeof obj.titleNode != 'undefined'){
                if(typeof data[obj.titleNode] != 'undefined'){
                    labelNode = data[obj.titleNode];
                }else if(typeof data.data[obj.titleNode] != 'undefined'){
                    labelNode = data.data[obj.titleNode];
                }
            }
        }
        /* Fin || Label del nodo segun su contenedor */

        /* Agregó los filtros al selector de busqueda */
        if(typeof obj.showFilters === 'boolean' && obj.showFilters){
            if(typeof this.elementID[this.domlastActiveTp].filters === 'undefined'){
                /* Valido que NO exista el objeto con las opciones del seletor de busqueda */
                this.elementID[this.domlastActiveTp]['filters'] = ['title'];
                obj = this.elementID[this.domlastActiveTp];
            }
            /* Segun la información que venga en el data agregamos al objeto filters */
            if(typeof data.data === 'object'){
                var infodataNode = data.data;
                for(var i in infodataNode){
                    if(obj.filters.indexOf(i) < 0){
                        this.elementID[this.domlastActiveTp].filters.push(i);
                    }
                }
            }

        }
        /* Finalizo de agregar los filtros al selector de busqueda */

        if(typeof data.children != 'undefined' && data.children.length > 0){
            if(prefixLayout == 'deta_' && (typeof dataBase.viewDetail != 'undefined' && dataBase.viewDetail == true)){
                 /* Extraigo la informacion del padre */
                 var node = this.minimalParentsNode(statusNde,encodeData,labelNode,idContainerNodes,prefixLayout,true)
                delete dataBase.viewDetail;
            }else{
                var node = `<li data-node="${encodeData}" id="parent_li_${idContainerNodes}" class="li_tp_node">
                                <div ${statusNde} data-tpid="${this.domlastActiveTp}" data-prefix="${prefixLayout}" data-parentnodetp="#li_${dataParentNode.replace('#','')}" onmousedown="topology.actionsByNode(this,'${prefixLayout}',event)" id="li_${idContainerNodes}" class="tp_node"><span>${labelNode}</span></div>
                                <ul id="${idContainerNodes}" class="tp_graph"></ul>
                            </li>`;  
            }
        }else{
            if(prefixLayout == 'deta_' && (typeof dataBase.viewDetail != 'undefined' && dataBase.viewDetail == true)){
                    var node = this.minimalParentsNode(statusNde,encodeData,labelNode,idContainerNodes,prefixLayout,false)
                delete dataBase.viewDetail;
            }else{
                var node = `<li data-node="${encodeData}" id="parent_li_${idContainerNodes}" class="li_tp_node">
                                <div ${statusNde} data-tpid="${this.domlastActiveTp}" data-prefix="${prefixLayout}" data-parentnodetp="#li_${dataParentNode.replace('#','')}" onmousedown="topology.actionsByNode(this,'${prefixLayout}',event)" id="li_${idContainerNodes}" class="tp_node not-child"><span>${labelNode}</span></div> 
                            </li>`;  
            }
        }
        
        if($(`#li_${idContainerNodes}`).length == 0){
            if(typeof data.jump == 'undefined'){
                /* Agrego el nodo al nodo padre */
                node = $(node);
                $(recipienteNodes).append(node); 
                this.elementID[this.domlastActiveTp]['totalNodes']++;
            }
        }
        if(typeof data.jump == 'boolean'){
            /* elimino las posiciones y seteo el contendor que va agregar los hijos  */
            delete dataBase.jump;
            delete data.jump;
            data.containerNodeTp = `#${prefixLayout}containerNode_${data.levelTp}_${data.posicionObject}_${this.domlastActiveTp}`;
        }
        /* valido las lineas superior e inferior */
        if($(`#parent_li_${idContainerNodes}`).parents('li').length == 0){
            $(`#li_${idContainerNodes}`).addClass('not-parents');
        }
        this.dragDrop(`#li_${idContainerNodes}`, prefixLayout);
        // this.dragDrop(`#li_${idContainerNodes}`, prefixLayout);
        if(typeof dataBase.children == 'object'){
            if(dataBase.children.length > 0){
                /* Arronco a crear todos los  nodos hijos */
                var countNodes = (typeof data.containerNodeTp !='undefined' ? $(data.containerNodeTp).children().length : $(`#${idContainerNodes}`).children().length );
                
                if(countNodes < dataBase.children.length){
                    /* Aumento el nivel del node y seteo los nuevos valores */
                    var posicionObject = (countNodes < 1) ? 0 : countNodes;
                    var nextObject = dataBase.children[posicionObject];
                    nextObject.containerNodeTp = (typeof data.containerNodeTp !='undefined' ? data.containerNodeTp : `#${idContainerNodes}` );
                    nextObject.containerParentTp = data.containerParentTp;
                    nextObject.levelTp = (dataBase.levelTp + 1);
                    nextObject.posicionObject = `${countNodes}__${dataBase.posicionObject}`;
                    this.createNode(dataBase,nextObject,prefixLayout,scale,(lvl+1));
    
                }else if(countNodes == dataBase.children.length){
                    /* LLegamos a la ultima posicion del objeto dataBase, ahora reiniciamos el contador y miramos si tiene mas subniveles */
                        var element = dataBase.children; 
                        element = this.cleanDataNode(element);
                        var ulContainer = $(`${data.containerNodeTp} li > ul`).attr('id');
                        /* Recorro el json e inicio a crear los  nodos hijos */
                        if(typeof ulContainer != 'undefined'){
                            element.jump = true;
                            this.call_node_generated(prefixLayout,`#${ulContainer}`,element,element.length,0, data.levelTp, `_${dataBase.posicionObject}`); 
                        }
                        this.resizeContainers(prefixLayout)
                }
            }
        }
    },
    getLocationNode(id,type,prefix){
        let obj  = this.elementID[this.domlastActiveTp];
        var positionContainer = $(obj.element).offset();
        /* Fin de obtengo las coordenadas del contenedor de la topología */
        var posicion = $(id).offset();
        var widthNode = ($(id).width() / 2);
        var heightNode = $(id).height();
        if(typeof posicion == 'undefined'){
            this.log_error(`El id del nodo no existe ${id}`);
            return false;
        }
        posicion.left = (posicion.left - (positionContainer.left + 1.5)) + widthNode;
        posicion.top = (posicion.top - (positionContainer.top + 2));
        if(prefix == 'pri_'){
            if(type == 'origen'){
                posicion.x = posicion.left;// + 0.5; /* + 11;*/
                posicion.y = posicion.top + (heightNode + 1); /* + 17;*/
            }else if(type == 'destino'){
                posicion.x = posicion.left - .2; /* + 11;*/
                posicion.y = (posicion.top - 1) - (heightNode / 2); /* - 15;*/
            }
        }
        else if(prefix == 'deta_'){
            posicion.top = (posicion.top - $(`#tp_layout_gen_${this.domlastActiveTp}`).height())
            if(type == 'origen'){
                posicion.x = posicion.left;// + 41.5;
                posicion.y = posicion.top + (heightNode + 4);// + 28.5;
            }else if(type == 'destino'){
                posicion.x = posicion.left;// + widthNode;
                posicion.y = posicion.top - (heightNode / 2);// - 24;
            }
        }
        return posicion;
    },
    setAttrLines(line,type){
        var idOrigen = $(`#${line}`).data('parentnode');
        var idDestino = $(`#${line}`).data('childnode');
        var locationOrigine = this.getLocationNode(idOrigen,'origen');
        var locationDestino = this.getLocationNode(idDestino,'destino');
        /* retorna las nuevas coordenadas del nodo */
        /* seteo las dimensiones del line svg */
        if(type=='origen'){
            document.getElementById(line).setAttribute('x1',locationOrigine.x);
            document.getElementById(line).setAttribute('y1',locationOrigine.y);
        }else if(type=='destino'){
            document.getElementById(line).setAttribute('x1',locationDestino.x);
            document.getElementById(line).setAttribute('y1',locationDestino.y);
        }
        /* seteo las dimensiones de las lineas del svg */
    },
    createLinesPP(idNodo,prefix,goNode=false,colorLine=false){
        /* Crea la linea de punto a punto */
        var id_svg = (prefix == 'deta_' ? `tp_svg_detail_${this.domlastActiveTp}` : `tp_svg_general_${this.domlastActiveTp}` );
        var containerRef = (prefix == 'deta_' ? `#tp_view_general_${this.domlastActiveTp}` : `#tp_view_general_${this.domlastActiveTp}` );
        var container = (prefix == 'deta_' ? `#tp_layout_deta_${this.domlastActiveTp}` : `#tp_layout_gen_${this.domlastActiveTp}` );
        var children = $(`[data-parentnodetp="${idNodo}"]`);
        /* Seteo la linea del nodo seleccionado */
        if($(idNodo).data('parentnodetp') != '#li_'){
            var idOrigine = $(idNodo).data('parentnodetp');
            if(typeof idOrigine == 'undefined'){
                return; 
            }
            var idNodeline =  `${idNodo}`.replace(`li_${prefix}containerNode`,`li_line_svg_${prefix}`);
            this.newLineSvg(idNodeline,idOrigine,idNodo,id_svg,container,containerRef,prefix, colorLine);
        }else{
            var idOrigine = `#li_`+$(idNodo).parents('ul')[0].id;
            if(idOrigine.search('li_tp_view_general_') < 0 ){
                /* Es diferente al contenedor principal  */
                var idNodeline =  `${idNodo}`.replace(`li_${prefix}containerNode`,`li_line_svg_${prefix}`);
                this.newLineSvg(idNodeline,idOrigine,idNodo,id_svg,container,containerRef,prefix, colorLine);
            }
        }

        if(children.length > 0){
            /* Elimino las lineas que conecta los hijos y obtengo las coordenadas del padre */
            $(`[data-parentnode="${idNodo}"]`).remove();
            for (let index = 0; index < children.length; index++) {
                const element = children[index];
                var idDestino = `#${element.id}`;
                var id_line =  `${idDestino}`.replace(`li_${prefix}containerNode`,`li_line_svg_${prefix}`);
                this.newLineSvg(id_line,idNodo,idDestino,id_svg,container,containerRef,prefix,colorLine);
            }
        }
        if(goNode){
            var center = ( $(idNodo).offset().left - ($(window).width() / 2) )
            $(container).scrollTop(0).scrollLeft( center );
        }
    },
    resizeContainers(prefix){
        var id_svg = `tp_svg_general_${this.domlastActiveTp}`;
        var containerSection = `tp_layout_gen_${this.domlastActiveTp}`;
        if(prefix == 'deta_'){
            containerSection = `tp_layout_deta_${this.domlastActiveTp}`;
            id_svg =  `tp_svg_detail_${this.domlastActiveTp}`
        }
        $(`#${containerSection}`).scrollLeft(0).scrollTop(0);
        /* Termino de definir los contenedores principales */
        /* Inicio Antes de poner la lnea miramos las dimensiones de los contenedores */
        var maxWidthSec = document.getElementById(containerSection).scrollWidth;
        var maxHeightSec = document.getElementById(containerSection).scrollHeight;
        document.getElementById(id_svg).setAttribute('width',maxWidthSec);
        document.getElementById(id_svg).setAttribute('height',maxHeightSec);
        /* Fin Antes de poner la lnea miramos las dimensiones de los contenedores */
        
        return true;

    },
    newLineSvg(id_line,idOrigine,idDestino,id_svg,container,containerRef,prefix,colorLine=false){
        /* Valid que el id no exista y de ser asi lo borro */
        this.resizeContainers(prefix);
        if($(id_line).length > 0){
            $(id_line).remove();
        }
        if(!colorLine){
            colorLine = `stroke:gray;stroke-width:1`;
        }
            
        var locationOrigine = this.getLocationNode(idOrigine,'origen',prefix);
        var locationDestino = this.getLocationNode(idDestino,'destino',prefix);
        if(!locationOrigine || !locationDestino){
            return false;
        }
        var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute('id',id_line.replace('#',''));
        newLine.setAttribute('x1',locationOrigine.x);
        newLine.setAttribute('y1',locationOrigine.y);
        newLine.setAttribute('x2',locationDestino.x);
        newLine.setAttribute('y2',locationDestino.y);
        
        newLine.setAttribute('data-parentnode',idOrigine);
        newLine.setAttribute('data-childnode',idDestino);
        newLine.setAttribute('data-parentsvg',id_svg);
        newLine.setAttribute('data-containersection',container);
        newLine.setAttribute('data-containersvg',containerRef);
        newLine.setAttribute('style',colorLine);
        document.getElementById(id_svg).appendChild(newLine);
        
    },
    actionsByNode(nodo,prefix,clk=null){
        var nodoId = '#'+nodo.id;
        var pNode = $(nodoId).parent('li').data('node');
        var data = decode(pNode); 
        this.domlastActiveTp = $(nodoId).data('tpid')
        let obj  = this.elementID[this.domlastActiveTp];
        imgHostname = (typeof obj.imgLoader != 'undefined' && obj.imgLoader != false ? obj.imgLoader : imgHostname );
        /* Seteo el loader por el que el venga en el objeto topology */
        /* Detecto si el click o click derecho */
        if(clk == null || clk.which == 1){
            /* Si es click izquierdo o no viene evento de click */
            if(prefix==='pri_'){
                /* Seteo los colores de las lineas a negro */
                var lines = document.querySelectorAll('line');
                for (let index = 0; index < lines.length; index++) {
                    const element = lines[index];
                    document.getElementById(element.id).setAttribute('style',`stroke:gray;stroke-width:1`);
                }
    
            }
            if(typeof obj.showDetail == 'boolean' && obj.showDetail==true){
                if(prefix==='pri_'){
                    $(".nodeAct").removeClass('nodeAct');
                    $(nodoId).addClass('nodeAct');
                    if($(`#btn_move${this.domlastActiveTp}`).length > 0){
                        $(`#btn_move${this.domlastActiveTp}`).remove()
                    }
                    this.showDetailTp(nodo,data);
                }else if(prefix==='deta_'){
                    if(typeof this.elementID[this.domlastActiveTp]['moveNode'] == 'undefined' || !this.elementID[this.domlastActiveTp]['moveNode'] ){
                        /* Si esta habilitado el movimiento de nodos no seguimos con el evento click */
                        nodoId = nodoId.replace('deta_','pri_');
                        this.actionsByNode({id:nodoId.replace('#','')}, 'pri_');
                        return;
                    }else{
                        var lines = $(`#tp_svg_detail_${this.domlastActiveTp} line`);
                        for (let index = 0; index < lines.length; index++) {
                            const element = lines[index];
                            document.getElementById(element.id).setAttribute('style',`stroke:gray;stroke-width:1`);
                        }
                    }
                }
            }
            /* topology.drawLinesTp(nodo.id); */
            topology.createLinesPP(nodoId,prefix,true,'stroke:red;stroke-width:1');
            obj.onclickNode(nodoId, data);
        }else if(clk.which == 3){
            topology.log_error('es click derecho');
            obj.onclickRightNode(nodoId, data);
            if(prefix==='deta_'){
                document.getElementById(nodo.id).oncontextmenu = new Function("return false");;
            }
        }
        
    },
    actionsByLine(line){
        let obj  = this.elementID[this.domlastActiveTp];
        this.log_error(line);
        
        /* agrego el evneto  a la acion principal para que se puede realizar mas que solo la accion predefinida */
    },
    dragDrop(id,prefix){
        let obj  = this.elementID[this.domlastActiveTp];
        if(prefix==='deta_' || (typeof obj.showDetail == 'undefined' || obj.showDetail==false) ){
            
            $(id).mouseover(function(e){
                $(this).parent('li').css('z-index',3);
                var pNode = `#parent_${this.id}`;
                data = decode($(pNode).data('node'));
                obj.hoverNode(id,data,true) 
                /* Si el hover se hace desde el detalle */
                if(prefix==='deta_'){
                    nodoId = this.id.replace('deta_','pri_');
                    $(`#${nodoId}`).addClass('hover');
                }
            }).mouseout(function(e){
                var pNode = `#parent_${this.id}`;
                data = decode($(pNode).data('node'));
                obj.hoverNode(id,data,false) 
                setTimeout(() => {
                    $(this).parent('li').css('z-index',1);
                }, 500);
                /* Si el hover se hace desde el detalle */
                if(prefix==='deta_'){
                    nodoId = this.id.replace('deta_','pri_');
                    $(`#${nodoId}`).removeClass('hover');
                }
            });
            
            $(id).draggable({
                start: function(e) {
                    if(typeof topology.elementID[$(this).data('tpid')]['moveNode'] == 'undefined' || topology.elementID[$(this).data('tpid')]['moveNode'] == false ){
                        return false;
                    }
                    topology.log_error(['start',e]);
                    var dataLine = $(`[data-childnode="${id}"]`);
                    var dataLine2 = $(`[data-parentnode="${id}"]`);
                    if(dataLine.length > 0 && dataLine2.length == 0){
                        $(`#${dataLine.prop('id')}`).remove();
                    }else if(dataLine2.length > 0 && dataLine.length == 0 ){
                        for (let index = 0; index < dataLine2.length; index++) {
                            const element = $(dataLine2[index]);
                            $(`#${element.prop('id')}`).remove();
                        }
                    }else if(dataLine2.length > 0 && dataLine.length > 0 ){
                        $(`#${dataLine.prop('id')}`).remove();
                        for (let index = 0; index < dataLine2.length; index++) {
                            const element = $(dataLine2[index]);
                            $(`#${element.prop('id')}`).remove();
                        }
                    }
                },
                drag: function(e) {
                    /* 
                        topology.log_error(['stop',e]);
                        var dataLine = $(`[data-childnode="${id}"]`);
                        var dataLine2 = $(`[data-parentnode="${id}"]`);
                        if(dataLine.length > 0 && dataLine2.length == 0){
                            topology.setAttrLines(`${dataLine.prop('id')}`);
                        }else if(dataLine2.length > 0 && dataLine.length == 0 ){
                            for (let index = 0; index < dataLine2.length; index++) {
                                const element = $(dataLine2[index]);
                                topology.setAttrLines(`${element.prop('id')}`,'destino');
                            }
                        }else if(dataLine2.length > 0 && dataLine.length > 0 ){
                            topology.setAttrLines(`${dataLine.prop('id')}`);
                            for (let index = 0; index < dataLine2.length; index++) {
                                const element = $(dataLine2[index]);
                                topology.setAttrLines(`${element.prop('id')}`);
                            }
                        }
                    */
                },
                stop: function(e) {
                    if(typeof topology.elementID[$(this).data('tpid')]['moveNode'] == 'undefined' || topology.elementID[$(this).data('tpid')]['moveNode'] == false ){
                        return false;
                    }
                    topology.log_error(['stop',e]);
                    topology.resizeContainers(prefix);
                    topology.createLinesPP(id,prefix,true, 'stroke:red;stroke-width:1');
                }
            });
        }
    },
    statusNode(status){
        let obj = this.elementID[this.domlastActiveTp];
        var chng = false;
        var rtn = {};
        switch (status){
            case '-1':
                chng = true;
                rtn = {style: "background-color: #d66cd6; color: white;", label : "never seen"};
            break;
            case '0':
                chng = true;
                rtn = {style: "background-color: #4dd04d; color: white;", label : "Ok"};
            break;
            case '1':
                chng = true;
                rtn = {style: "background-color: red; color: white;", label : "Down"};
            break;
            case '2':
                chng = true;
                rtn = {style: "background-color: #ffa400; color: white;", label : "Snmp Down"};
            break;
        }
        if(!chng){
            rtn = null;
        }
        return rtn;
    },
    showDetailTp(nodo,dataNode){
        this.elementID[this.domlastActiveTp]['moveNode'] = false;
        var prefix = 'deta_';
        var secContainer = `#tp_layout_deta_${this.domlastActiveTp}`;
        var ulContainer = `#tp_view_detail_${this.domlastActiveTp}`;
        var svgContainer = `#tp_svg_detail_${this.domlastActiveTp}`;
        var dataTp = this.elementID[this.domlastActiveTp]['dataTopology'];
        var posicionObject = (dataNode.posicionObject == 0 ? dataNode.posicionObject : dataNode.posicionObject.split('__'));
        /* Agrego boton que permite la accion de mover los nodos */
        var btnDrag = `<button class='btn_move' data-tpid="${this.domlastActiveTp}" id="btn_move${this.domlastActiveTp}">Mover elementos</button>`;
        if($(`#btn_move${this.domlastActiveTp}`).length == 0){
                /* $(secContainer).append(btnDrag); */
                $(`#btn_move${this.domlastActiveTp}`).click(function(e){
                    e.preventDefault();
                    var tpid = $(this).data('tpid');
                    if(!topology.elementID[tpid]['moveNode']){
                        /* Puede mover los elementos */
                        topology.elementID[tpid]['moveNode'] = true;
                        $(this).html('Dejar de Mover los elementos');
                    }else{
                        /* No puede mover los elementos */
                        topology.elementID[tpid]['moveNode'] = false;
                        $(this).html('Mover elementos');
                    }

                });

        }
        /* Fin de la acción */
        if($(ulContainer).children().length > 0){
            $(ulContainer).empty();
            $(svgContainer).empty();
            document.getElementById(svgContainer.replace('#','')).setAttribute('width',10);
            document.getElementById(svgContainer.replace('#','')).setAttribute('heigth',10);
            /* Seteo el ancho del svg  */
        }
        $(secContainer).removeClass('active');
        if(posicionObject == 0){
            $(`#btn_move${this.domlastActiveTp}`).remove();
            newData = dataTp[0];
            delete newData.containerParentTp;
            delete newData.containerNodeTp;
        }else{
            var newData = null;
            for (let index = (posicionObject.length - 1); index >= 0; index--) {
                const element = parseInt(posicionObject[index]);
                if(newData == null){
                    newData = dataTp[element];
                }else{
                    newData = newData.children[element];
                }
            }
            newData.viewDetail = true;
            delete newData.containerParentTp;
            delete newData.containerNodeTp;
        }
        /* Reinicio los contenedores por los del detalle */
        loading(secContainer);
        this.call_node_generated(prefix,ulContainer,[newData],1);
        this.toplogyIsEndUpload(prefix,(resp)=>{
            this.log_error('finalizo la carga del detalle de la topologia');
            var idNodo = `#${$(`${ulContainer} .tp_node`)[0].id}`;
            this.drawLinesTp(false,prefix);
            /* Despues de pintar las lineas centramos el nodo */
            loading(secContainer,true);
            setTimeout(() => {
                var center = ( $(idNodo).offset().left - ($(window).width() / 2) )
                $(secContainer).scrollTop(0).scrollLeft( center ); 
                $(secContainer).addClass('active');
                var id_Nodo = `#${nodo.id.replace('pri_','deta_')}`;
                $(id_Nodo).addClass('border');
            }, 400);
        });

    },
    minimalParentsNode(statusNde,encodeData,labelNode,idContainerNodes,prefixLayout,child){
        var node_pt = `#li_${idContainerNodes.replace('deta_','pri_')}`;
        var li = $(node_pt).parents('li')[1];
        var dataPadre = $(li).data('node');
        var deco = decode(dataPadre);
        var tpNode = $(li).find('.tp_node')[0];
        var idtpUlNode = $(li).find('ul')[0].id;
        var newPadreId = $(tpNode).prop('id').replace('pri_', prefixLayout );
        var colorN = `background-color:${$(tpNode).prop('style').backgroundColor}; color: ${$(tpNode).prop('style').color}`;
        var ul = ``;
        if(child){
            ul = `<ul id="${idContainerNodes}" class="tp_graph"></ul>`;
        }
        var node_ = `<li data-node="${dataPadre}" id="parent_li_${idtpUlNode}" class="li_tp_node">
                        <div style="${colorN}" data-tpid="${this.domlastActiveTp}" data-prefix="${prefixLayout}" data-parentnodetp="#li_" onmousedown="topology.actionsByNode(this,'${prefixLayout}',event)" id="${newPadreId}" class="tp_node not-parents"><span>${deco.title}</span></div>
                        <ul id="${idtpUlNode.replace('pri_','deta_')}" class="tp_graph">
                            
                            <li data-node="${encodeData}" id="parent_li_${idContainerNodes}" class="li_tp_node">
                                <div ${statusNde} data-tpid="${this.domlastActiveTp}" data-prefix="${prefixLayout}" data-parentnodetp="#${newPadreId}" onmousedown="topology.actionsByNode(this,'${prefixLayout}',event)" id="li_${idContainerNodes}" class="tp_node"><span>${labelNode}</span></div>
                                ${ul}
                            </li>

                        </ul>
                    </li>`;
        return node_;

    },
    refreshTopology(){

    },
    refreshTopologyNode(){

    },
    summaryNodes(){
        let obj = this.elementID[this.domlastActiveTp];
        /* Agrego las opciones al selector */
        
        let filters = obj.filters;
        var options = [`<option value="" >-Seleccione-</option>`];
        for (let index = 0; index < filters.length; index++) {
            const element = filters[index];
            var op = `<option value="${element}" >${element}</option>`;
            options.push(op);
        }
        var tmpVal = $(`#searchNode_${this.domlastActiveTp}`).val();
        $(`#searchNode_${this.domlastActiveTp}`).html(options.join(''));
        if(tmpVal!=''){
            $(`#searchNode_${this.domlastActiveTp}`).val(tmpVal);
        }
        
        this.log_error(obj['totalNodes']);
        var ul = `<ul class="list_summary" id="list_summary${this.domlastActiveTp}">
                    <li class="header"><h3>Resumen</h3></li>
                    <li>Total ${(typeof obj.titleNodeSummary == 'undefined') ? 'Nodos' : obj.titleNodeSummary }: <span>${obj['totalNodes']}</span></li>
                  </ul>`;
        $(`#infoSummary_${this.domlastActiveTp}`).html(ul);
    },
    searhByFilterTp(key,value){
        let obj = this.elementID[this.domlastActiveTp];
        $('.filt').removeClass('filt');
        if($(`#resultFilt${this.domlastActiveTp}`).length > 0){
            $(`#resultFilt${this.domlastActiveTp}`).remove();
        }
        var nodes = $(`[data-tpid='${this.domlastActiveTp}']`);
        var coincidencias = 0;
        for (let index = 0; index < nodes.length; index++) {
            const element = nodes[index];
            var dataNode = $($(element).parents('li')[0]).data('node');
                dataNode = decode(dataNode);
            if(typeof dataNode.data === 'object'){
                /* Valido si el nodo contiene la info filtrada */
                let informationNode = dataNode.data;
                if(typeof informationNode[key] !== 'undefined' && informationNode[key] != null){
                    if(informationNode[key].toLowerCase().indexOf(value.toLowerCase()) >= 0){
                        /* El texto filtrado por el campo existe, pinto en la tp los que aplican */
                        $(element).addClass('filt');
                        let containerParent = $(`#${element.id}`).parents('section')[0];
                        if(containerParent.id == `tp_layout_gen_${this.domlastActiveTp}`){
                            /* Valido que unicamente sume las coincidencias de la vista general */
                            coincidencias++;
                        }
                    }
                }else if(typeof dataNode[key] !== 'undefined'  && informationNode[key] != null){
                    if(dataNode[key].toLowerCase().indexOf(value.toLowerCase()) >= 0){
                        /* El texto filtrado por el campo existe, pinto en la tp los que aplican */
                        $(element).addClass('filt');
                        let containerParent = $(`#${element.id}`).parents('section')[0];
                        if(containerParent.id == `tp_layout_gen_${this.domlastActiveTp}`){
                            /* Valido que unicamente sume las coincidencias de la vista general */
                            coincidencias++;
                        }
                    }
                }
                
            }
        }
        var li = `<li id="resultFilt${this.domlastActiveTp}">Total Coincidencias: <span class="filter">${coincidencias}</span></li>`;
        $(`#list_summary${this.domlastActiveTp}`).append(li);
    }
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