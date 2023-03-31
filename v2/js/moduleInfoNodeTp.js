class infoNodeTP {

  constructor(config = {}, load = false) {
    if (load) {
      this.configurationTp = config;
      this.build();
    };
  };
  /* Muestra el loader */
  loading(hidden = false) {
    const containerLoading = (this.config.containerDomCanvas !== undefined ? this.config.containerDomCanvas : 'body');
    const imgHostname = (this.config.imageLoader !== undefined ? this.config.imageLoader : './css/logoEsol.png');

    if ($("#containerLoading").length == 0) {
      const htmlLoading = $('<div class="containerLoading in" id="containerLoading"></div>');
      htmlLoading.html('<div class="doubleLine"> <div></div> <div></div> <div> <div></div> </div> <div> <div></div> </div> <div class="imgCenter"> <img src="' + imgHostname + '" alt="Cargando..." ></div></div>');
      $(containerLoading).append(htmlLoading);
      if (hidden == true) {
        $("#containerLoading").removeClass('in');
        setTimeout(function () {
          $("#containerLoading").remove();
        }, 500);
      };
    } else {
      $(".containerLoading").removeClass('in');
      setTimeout(function () {
        $(".containerLoading").remove();
      }, 500);
    };
  };
  /* Metodo para peticiones por ajax */
  ajax(page, jsonSend, metod, funcion, erno, rtn = null) {
    $.ajax({
      type: metod,
      url: page,
      data: jsonSend,
      cache: false,
      contentType: false,
      processData: false,
      success: function (data) {
        if ((rtn == 'json' || rtn == 'js' || rtn == 'JSON') && typeof data === 'string') {
          data = JSON.parse(data);
        };
        if (typeof funcion != 'undefined') {
          funcion(data);
        };
      },
      error: function (data) {
        if (typeof erno == 'function') {
          erno(data);
        };
      }
    });
  };
  arrow(direction) {
    let elm = ``
    switch (direction) {
      case 'up':
        elm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/>
                  </svg>`
        break;
      case 'down':
        elm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                      <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
                  </svg>`
        break;
      case 'left':
        elm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
                </svg>`
        break;
      case 'rigth':
        elm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                      <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
                  </svg>`
        break;
    }

    return elm;

  };
  build() {
    console.log(this.configurationTp)
    this.containerInforamtion();
  }

  containerInforamtion() {
    const uuid = this.configurationTp.interactionTp.uuid;
    const config = $(this);
    const accordion = `
          <div id="accordion_${uuid}" class="accordion">
              <div class="section">
                  <label data-toggle='e-resources' data-uuid="${uuid}" >E-RESOURCES <small>${this.arrow('up')}</small></label>
                  <div data-children='e-resources' data-uuid="${uuid}" class="cja-children active" >
                      ${this.returnInfo('e-resources')}
                  </div>
              </div>
              <div class="section">
                  <label data-toggle='e-fault-sev' data-uuid="${uuid}" >E-FAULTS <small>${this.arrow('up')}</small></label>
                  <div data-children='e-fault-sev' data-uuid="${uuid}" class="cja-children active" >
                    ${this.returnInfo('e-fault-sev')}
                  </div>
              </div>
              <div class="section">
                  <label data-toggle='e-monitor' data-uuid="${uuid}" >E-MONITOR <small>${this.arrow('up')}</small></label>
                  <div data-children='e-monitor' data-uuid="${uuid}" class="cja-children active" >
                    <!-- Aca se pinta e-monitor, la peticion se realiza por ajax -->
                  </div>
              </div>
          </div>
      `;
    $(`#${this.configurationTp.domId}`).html(accordion);
    this.getInfoMonitor(`[data-children="e-monitor"]`, uuid);

    /* Activamos tooltip por su clase */
    $(".titleHover").hover(function () {
      let info = $(this).attr('title');
      $(this).append(`<div class="tooltip">${$(this).text().trim()} | ${info} </div>`)
      console.log(info)
    }, function () {
      $(`.tooltip`).remove()
    })

    const arrow = this.arrow;
    $(`[data-toggle]`).click(function (e) {
      const dom_ = $(this);
      const ref = $(this).data('toggle');
      console.log(config);


      $(`label[data-uuid="${uuid}"] small`).map((k, i) => {
        // $(i).html(arrow('down')); /* Activar para hacer el acordion con una unica apertura */
      });

      $(`[data-children]`).map((k, i) => {
        if ($(i).data().uuid === uuid) {
          if ($(i).data().children == ref) {
            if (!$(i).hasClass('active')) {
              $(i).addClass('active');
              $(dom_).find('small').html(arrow('up'))
            } else {
              $(i).removeClass('active');
              $(dom_).find('small').html(arrow('down'))
            }
          } else {
            // $(i).removeClass('active'); /* Activar para hacer el acordion con una unica apertura */
          }
        }

      })

    })
  }
  returnInfo(type) {
    console.log(this.configurationTp)
    let elment = ``;
    switch (type) {
      case 'e-resources':

        elment += this.configurationTp.htmlBasiInfo.find((k, i) => k.indexOf('title') >= 0).replace('title', 'Nombre')
        elment += this.configurationTp.htmlBasiInfo.find((k, i) => k.indexOf('ip') >= 0).replace('ip', 'Ip')
        elment += this.configurationTp.htmlBasiInfo.find((k, i) => k.indexOf('status') >= 0).replace('status', 'Estado')
        elment += this.configurationTp.htmlBasiInfo.find((k, i) => k.indexOf('type') >= 0).replace('type', 'Tipo')
        elment += this.configurationTp.htmlBasiInfo.find((k, i) => k.indexOf('model') >= 0).replace('model', 'Modelo')

        break;
      case 'e-fault-sev':

        if (this.configurationTp.info.faults !== undefined) {
          /* Severidades */
          elment += `<li class="division"> Severidades </li>`;
          for (var i in this.configurationTp.info.faults.severity) {
            const canti = this.configurationTp.info.faults.severity[i];
            const dataSev = this.configurationTp.tp.statusSeverityNode(i);
            if (dataSev['label'] != undefined) {
              elment += `<li class="ligths-faults">
                          <div title="${dataSev['label']}" class="circle-fault titleHover" style="background-color:${dataSev['color']}" >
                          ${canti}
                          </div>
                        </li>`;
            }

          };
          /* Clases */
          elment += `<li class="division"> Clases </li>`;
          /* Clases */
          const severityClass = this.configurationTp.interactionTp.dataSeverityClass;
          for (var i in this.configurationTp.info.faults.class) {
            const canti = this.configurationTp.info.faults.class[i];
            severityClass.map((k) => {
              if (k.class == i) {
                elment += `<li class="ligths-faults">
                              <div title="${k.name}" class="circle-fault titleHover" style="background-color:black; color:white" >${canti}</div>
                            </li>`;
              }
            })
          };
        } else {
          elment = `<p>El Equipo no registra severidad</p>`;
        }

        break;
    }
    return elment;
  }

  /**
   * Este método obtiene la informacion de `e-monitor` mediante una petición por **Ajax**.
   * 
   * @param { string } caja - Selector de la caja
   * @param { string|number } uuid - Identificador del elemento.
   * @returns { void }
   */
  getInfoMonitor(caja, uuid) {
    if (typeof caja !== "string") {
      throw new Error("El selector debe ser de tipo `string`");
    }

    if (typeof uuid !== "string" && typeof uuid !== "number") {
      throw new Error("El identificador debe ser de tipo `string` o `number`");
    }

    /**
     * @type { FormData }
     */
    let formData = new FormData();

    formData.append('function_name', 'getTopologyMonitor');

    formData.append('params', JSON.stringify({
      id: this.configurationTp.info.id,
      dnsname: this.configurationTp.info.dnsname,
    }));

    this.ajax(this.configurationTp.interactionTp.server.url, formData, 'POST', (resp) => {

      /**
       * Código HTML generado automáticamente.
       * 
       * @type { string }
       */
      let element = '';

      /**
       * Caja contenedor de `e-monitor`
       * 
       * @type { NodeListOf<HTMLElement> }
       */
      const boxElements = document.querySelectorAll(caja);

      if (Object.keys(resp).length > 0) {

        for (const [key, value] of Object.entries(resp)) {
          const {
            memory_avg,
            memory_max,
            cpu_avg,
            cpu_max,
            latency_avg,
            latency_max,
            jitter_avg,
            jitter_max,
            ploss_avg,
            ploss_max,
            percentage,
            number_down
          } = value;

          switch (key) {
            case "memory":

              const component = `
              <div title="Consumo promedio de memoria" class="circle-fault titleHover info-list" style="background-color:white">
                Memoria promedio (memoria): ${memory_avg}
              </div>

              <div title="Consumo máximo de memoria" class="circle-fault titleHover info-list" style="background-color:white">
                Consumo máximo (memoria): ${memory_max}
              </div>
              `;

              element += `<li class="division bottom">
                ${component}
              </li>`;
              break;

            case "performance":
              const componentPerformance = `
              <div title="Performance Latency Avg" class="circle-fault titleHover info-list" style="background-color:white">
                Latencia promedio: ${latency_avg}
              </div>

              <div title="Performance Latency Max" class="circle-fault titleHover info-list" style="background-color:white">
                Latencia máxima: ${latency_max}
              </div>

              <div title="Performance Jitter Avg" class="circle-fault titleHover info-list" style="background-color:white">
                Jitter promedio: ${jitter_avg}
              </div>

              <div title="Performance Jitter Max" class="circle-fault titleHover info-list" style="background-color:white">
                Jitter máximo: ${jitter_max}
              </div>

              <div title="Performance Ploss Avg" class="circle-fault titleHover info-list" style="background-color:white">
                Ploss promedio: ${ploss_avg}
              </div>

              <div title="Performance Ploss Max" class="circle-fault titleHover info-list" style="background-color:white">
                Ploss máximo: ${ploss_max}
              </div>
              `;

              element += `<li class="division bottom">
                ${componentPerformance}
              </li>`;
              break;

            case "availability":
              const componentAvailability = `
              <div title="Availability percentage" class="circle-fault titleHover info-list" style="background-color:white">
                Percentage: ${percentage}
              </div>

              <div title="Availability Number Down" class="circle-fault titleHover info-list" style="background-color:white">
                Number Down: ${number_down}
              </div>
              `;

              element += `<li class="division bottom">
                ${componentAvailability}
              </li>`;
              break;

            case "cpu":
              const componentCPU = `
              <div title="Memory Avg" class="circle-fault titleHover info-list" style="background-color:white">
                Consumo promedio (CPU): ${cpu_avg}
              </div>

              <div title="Memory Max" class="circle-fault titleHover info-list" style="background-color:white">
                Consumo máximo (CPU): ${cpu_max}
              </div>
              `;

              element += `<li class="division bottom">
                ${componentCPU}
              </li>`;
              break;
          }
        }
      }

      boxElements.forEach(boxElement => {
        if (boxElement instanceof HTMLElement) {
          const { uuid: uuidElement } = boxElement.dataset;

          if (uuidElement && (uuid == uuidElement)) {
            boxElement.insertAdjacentHTML('beforeend', element);
          }
        }
      });

    }, false, 'js');

    $(".titleHover").hover(function () {
      /**
       * @type { string }
       */
      let info = $(this).attr('title');

      $(this).append(`<div class="tooltip">${$(this).text().trim()} | ${info} </div>`)

    }, function () {
      $(`.tooltip`).remove()
    });
  }
}

$.fn.infoNode = function (config) {
  config.domId = `${$(this).prop('id')}`;
  (new infoNodeTP(config, true));
};