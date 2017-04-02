/*!
 * uploadZone v1.0.0
 *
 * Copyright (c) 2017 Otacilio Compassi
 * Released under the MIT license
 *
 * Date: 2017-03-25
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined'){
        factory(require('jquery'));
    } else {
        if(typeof define === 'function' && define.amd){
            define('uploadZone', ['jquery'], factory);
        } else {
            factory(global.$);
        }
    }
}(this, (function ($) { 
    'use strict';

    // objeto do plugin ----------------------------------------------
    var zone = {

        files: [],          // a lista de arquivos

        // elementos html do plugin
        elements: {
            content: '',    // elemento geral do componente
            dropZone: '',   // elemento de zone para upload
            input: '',      // elemento input[type=file] da zone
            inputSpan: '',  // elemento que representa o botão de upload
            listContent: '',// elemento que sera usado como content da lista de exibição
        },

        // conjunto de opções para a configuração
        config: {
            accepts: 'image/*',     // define o tipo de upload permitido
            multiple: true,         // define que o upload permite multiplos arquivos
            dropZone: true,         // define uma area de drop and drag

            // define o tema da estrutura html do componente
            theme: {
                // define o tema para o panel geral do componente
                panel: {
                    panel: 'panel-primary',         // define a class css do panel
                    title: 'Zone Upload - PLugin'   // define o titulo do panel
                },
                // define o tema da zone de drag and drop
                dropZone: {
                    icon: true,                                     // define se tem icone ou não
                    iconClass: 'glyphicon glyphicon-cloud-upload',  // define o icone a ser exibido
                    textDrop: 'Drag and drop \n or',                // define o texto do drag and drop, use \n para quebra linha
                    // define o tema do botão de upload
                    inputSpan: {
                        class: 'btn-primary',   // define a class css do botão
                        text: 'Select file'     // define o texto do botão
                    },  
                },
                // define o tema dos botões na lista de gerenciamento dos arquivos
                // states: [upload, cancel, remove, preview, edit, crop, cancelCrop]
                // [upload, edit, remove]     1º
                // upload:click [cancel]  2º
                // edit:click [crop, cancelCrop, remove] 3º
                // cancelCrop:click volta pro 1º
                // crop: [upload, preview, remove] 4º
                // preview:click exibe modal com o preview
                uploadButtons: {
                    upload: {
                        class: 'btn btn-success btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-cloud-upload',
                    },
                    cancel: {
                        class: 'btn btn-warning btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-ban-circle',
                    },
                    edit: {
                        class: 'btn btn-primary btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-edit',
                    },
                    remove: {
                        class: 'btn btn-danger btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-remove',
                    },
                    preview: {
                        class: 'btn btn-primary btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-open-eye',
                    },
                    crop: {
                        class: 'btn btn-primary btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-leaf',
                    },
                    cancelCrop: {
                        class: 'btn btn-primary btn-xs btn-flat',
                        icon: 'glyphicon glyphicon-ban-circle',
                    },
                },
            }
        },
        
        // metodos do plugin
        methods: {
            // função que define configurações de eventos
            init: function () {

                // eventos ------------------------------------------------------
                // copia os arquivos dropados para o input change
                $(document).on('drop dragover', function (e) {
                    e.originalEvent.dataTransfer.dropEffect = "copy";
                });

                // botão personalizado para upload
                $(zone.elements.inputSpan).on('click', function (e) {
                    e.stopImmediatePropagation();
                    $(zone.elements.input).trigger('click', false);
                });

                // eventos de drag and drop
                $(zone.elements.dropZone).on('paste', function (e) {
                    // não implementado
                    console.log('paste');
                });
                $(zone.elements.dropZone).on('drop', function (e) {
                    var files = e.originalEvent.dataTransfer.files;
                    zone.methods._addFiles(files);              // chama o metodo que carrega os arquivos
                });
                $(zone.elements.dropZone).on('dragover', function (e) {
                    // não implementado
                    console.log('dragover');
                });

                // evento de change do proprio file upload
                $(zone.elements.input).on('change', function (e) {
                    zone.methods._addFiles($(this).prop('files'));      // chama o metodo que carrega os arquivos
                    $(zone.elements.input).val('');                     // remove os itens do input file
                });

                

                $(document).on('zone-upload', '.zone-upload', function (e, file) {
                    alert('upload');
                });
                $(document).on('zone-edit', '.zone-edit', function (e, file) {
                    zone.methods.destroyCropper('.zone-image-preview');
                    var listItem = $('.active-item');
                    listItem.find('.zone-preview').remove();

                    $(this).parents('li').addClass('active-item');

                    var image = zone.methods._displayImage(file);
                    $(zone.elements.dropZone).children().hide();
                    $(zone.elements.dropZone).append(image);
                    zone.methods.setCropper(image);
                    $(this).remove();
                });
                $(document).on('zone-remove', '.zone-remove', function (e, file) {
                    zone.methods._removeFile(file);
                    $(this).parents('li').remove();
                });
            },

            // função que inicia o plugin
            uploadZone: function (item, options) {            
                
                // define a forma da chamada do contrutor
                if (!!this) {
                    zone.elements.content = $(this)[0];  // define o content como elemento html
                    options = item;     // não existe seletor
                } else {
                    zone.elements.content = $(item)[0];  // define o content como elemento html
                }

                var defaults = $.extend(zone.config, options);
                zone.methods._createPanel(defaults.theme.panel, zone.elements.content);  // faz a chamada para a contrução do panel

                // controi a area de drop zone se estiver mercado como true
                if (defaults.dropZone) {
                    zone.methods._createDropZone(defaults);  // faz a chamada para a contrução da area de drag and drop
                    zone.methods._createFileList();
                }

                zone.methods.init();    // carrega os eventos do plugin

                // retorna o zone
                return zone;
            },

            // função que inicia o cropper
            setCropper: function (element, cropperOptions) {

                var options = $.extend(cropperOptions, {
                    aspectRatio: 1 / 1,
                    viewMode: 1,
                    //preview: '.image-preview',
                    dragMode: 'move',
                    cropBoxResizable: false,
                    cropBoxMovable: false,
                    scalable: false,
                    rotatable: false,
                    highlight: true,
                    autoCropArea: 1,
                    built: function () {
                        // obtem as dimensões do conteiner do crop, { width: xx, height: xx }
                        var container = $(this).cropper('getContainerData');
                        var width = container.width / 2;
                        var height = container.height / 2;

                        // configurando a largura para pegar metade do conteudo
                        // não é preciso ajustar a altura qunado o aspectRatio for quadrado
                        $(this).cropper('setCropBoxData', { width: width });

                        // obtem as dimensões do crop box, { width: xx, height: xx, left: xx, top: xx }
                        var cropData = $(this).cropper('getCropBoxData');
                        var cropTop = cropData.height / 2;
                        var cropLeft = cropData.width / 2;

                        // ajusta a posição inicial após as dimensões serem especificadas
                        $(this).cropper('setCropBoxData', { top: height - cropTop, left: width - cropLeft });
                    }
                })

                $(element).cropper(options);
            },

             // função que remove o crop
            destroyCropper: function (element) {
                $(element).cropper("destroy")
                $(element).remove();
            },

            // funções para gerenciamento de arquivos --------------------
            // função que adiciona os arquivos para a lista de arquivos
            _addFiles: function (files) {

                // para cada arquivo adiciona na lista
                for (var i = 0; i < files.length; i++) {
                    zone.methods._loadImage(files[i]);  // chama a função que carrega as imagens
                    zone.files.push(files[i]);          // adiciona os arquivos na lista

                    zone.methods._createItemList(files[i], zone.config.theme.uploadButtons); // adiciona os itens na lista em html
                }
            },

            // função que remove um arquivo da lista de arquivos
            _removeFile: function (file) {
                for (var i = 0; i < zone.files.length; i++) {
                    if (file.index === zone.files[i].index) {
                        zone.files.splice(i, 1);
                        return;
                    }
                }
            },

            // função que carrega uma imagem
            _loadImage: function (file) {
                var reader = new FileReader();  // cria uma instancia do FileReader para criar um preview da imagem
                var extension = file.name.substring(file.name.lastIndexOf('.'), file.name.length); // obtem a extensão do arquivo

                file.tempName = _guid(3) + extension;   // cria um nome generico para o arquivo
                file.index = _guid(4);

                // acept type       /^image\/(gif|jpeg|png)$/
                var type = new RegExp('^.*\.(jpg|jpeg|png|gif)$');
                var accept = new RegExp('^image\/(jpg|jpeg|png|gif)$');

                // verifica se o arquivo é uma imagem, pelo nome e pelo tipo
                if (type.test(file.name) && accept.test(file.type)) {
                    reader.onload = function (e) {
                        file.path = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            },

            // função que exibe a imagem
            // arquivo: o item do file ou blob
            // width:   largura da imagem a ser exibida
            // height:  altura da imagem a ser exibida
            _displayImage: function (file, width, height) {
                return $('<img />')
                .attr('src', file.path)
                .addClass('zone-image-preview')
                .prop('index', file.lastModified)
                .css({ 'width': width || '100px', 'height': height || '50px' });
            },

            // funções para criação de html ------------------------------
            // função que adiciona o panel ao html
            _createPanel: function  (options, context) {

                // definindo elementos do panel em html
                var panel = $('<div class="panel">');
                var head = $('<div class="panel-heading">');
                var body = $('<div class="panel-body">');
                var row = $('<div class="row">');
                var title = $('<span>');

                panel.addClass(options.panel);  // adiciona a class css definido nas opções
                title.text(options.title);      // adiciona o texto definido nas opções

                panel.append(head, body);       // adiciona o panel-heading e o panel-body ao panel
                body.append(row);               // adiciona uma linha ao panel-body
                head.append(title);             // adiciona o span titulo ao panel-heading

                $(context).append(panel);       // adiciona o panel ao contexto
            },

            // função que controi a area de upload
            _createDropZone: function (options) {

                // definindo elementos do drop zone em html
                var column = $('<div class="col-md-8">');
                var dropZoneArea = $('<div class="upload-zone-content">');
                var icon = $('<p class="upload-zone-icon">');
                var input = $('<input type="file" class="upload-zone-input">');
                var inputSpan = $('<span class="upload-zone-input-clone btn">');
                var textDropArea = $('<div class="upload-zone-drag-and-drop">');
                var theme = options.theme.dropZone;     // abrevia o caminho de acesso
                var texts = theme.textDrop.split('\n');  // obtem os textos do drop zone

                // definindo atributos do input file
                input.attr(
                {
                    'accept': options.accepts,
                    'multiple': options.multiple
                });

                // definindo class css e texto do botão de upload
                inputSpan.addClass(theme.inputSpan.class).text(theme.inputSpan.text);

                // verifica se pode criar um icone            
                if (theme.icon) {
                    icon.append($('<i>').addClass(theme.iconClass));
                    textDropArea.append(icon);
                }
                
                // para cada texto do drop zone crie um paragrafo
                for (var i = 0; i < texts.length; i++) {                
                    // verifica se o texto não é null ou vazio
                    if (!!texts[i]) {
                        var span = $('<p>').text(texts[i]);
                        textDropArea.append(span);
                    }
                }
                
                // adicionando os elementos ao contexto atual
                textDropArea.append(inputSpan);
                column.append(dropZoneArea);
                dropZoneArea.append(input, textDropArea);
                $(zone.elements.content).find('.panel-body .row').append(column);

                // atribuindo elementos ao contexto
                zone.elements.input = input[0];
                zone.elements.inputSpan = inputSpan[0];
                zone.elements.dropZone = dropZoneArea[0];
            },

            // função que controi a lista lateral de arquivos
            _createFileList: function () {
                
                // definindo elementos da lista de itens em html
                var column = $('<div class="col-md-4">');
                var listContent = $('<div class="upload-zone-list-content">');
                
                column.append(listContent);
                $(zone.elements.content).find('.panel-body .row').prepend(column);

                // atribuindo elementos ao contexto
                zone.elements.listContent = $(listContent)[0];
            },

            // função que controi o item da lista
            _createItemList: function (file, options) {

                var listContent = $(zone.elements.listContent);

                // definindo elementos
                var list = $(listContent).find('ol')[0] || $(listContent).find('ul')[0] || $('<ol>');
                var listItem = $('<li>');
                var contentItem = $('<div>');
                var contentItemDetails = $('<div>');
                var contentItemPreview = $('<div>');
                var contentItemButtons = $('<div>');
                var preview = $('<img>');
                var icon = $('<i>');
                var title = $('<div>');
                var size = $('<span>');

                var button = [$('<span>'), $('<span>'), $('<span>')];
                
                // obtem o tipo de arquivo
                var type = file.type.substring(0, file.type.lastIndexOf('/'));  // obtem o tipo do arquivo
                var iconClass = "";

                // seleciona o icone de exibição
                switch (type) {
                    case 'text': iconClass = "glyphicon glyphicon-file";
                        break;
                    case 'image': iconClass = "glyphicon glyphicon-picture";
                        break;
                    case 'audio': iconClass = "glyphicon glyphicon-headphones";
                        break;
                    case 'video': iconClass = "glyphicon glyphicon-facetime-video";
                        break;
                    case 'application': iconClass = "glyphicon glyphicon-play";
                        break;
                    default: iconClass = "glyphicon glyphicon-question-sign";
                        break;
                } 

                $(list).addClass('upload-zone-list');
                listItem.addClass('upload-zone-list-item');  
                

                contentItemPreview.addClass('item-preview');  
                contentItemDetails.addClass('item-details');  
                contentItemButtons.addClass('item-actions');  

                icon.addClass(iconClass);

                title.text(file.tempName);
                size.text(_size(file.size));

                button[0].addClass('zone-upload ' + options.upload.class).prop('file', file).append($('<i>').addClass(options.upload.icon));
                button[1].addClass('zone-edit ' + options.edit.class).prop('file', file).append($('<i>').addClass(options.edit.icon));
                button[2].addClass('zone-remove ' + options.remove.class).prop('file', file).append($('<i>').addClass(options.remove.icon));

                $(button[0]).on('click', function(e){
                    $(this).trigger('zone-upload', $(this).prop('file'));
                });
                $(button[1]).on('click', function(e){
                    $(this).trigger('zone-edit', $(this).prop('file'));
                });
                $(button[2]).on('click', function(e){
                    $(this).trigger('zone-remove', $(this).prop('file'));
                });

                contentItemPreview.append(icon);
                contentItemDetails.append(title, size);
                contentItemButtons.append(button);
                contentItem.append(contentItemPreview, contentItemDetails, contentItemButtons);
                listItem.append(contentItem);
                $(list).append(listItem);
                
                // verifica se não existe uma lista
                if (listContent.find('ol').length === 0 || listContent.find('ul').length === 0) {
                    $(zone.elements.listContent).append(list);
                }

                // atribuindo elementos ao contexto
                
            }
        },
    }

    // funções internas ----------------------------------------------

    // função que cria um GUID/UUID
    function _guid (length) {
        var context = "";
        
        for (var i = 0; i < length; i++) {
            context += _s4();
        }

        return context;
    }

    // função que retorna um numero aleatorio hexadecimal
    // retorna 4 digitos
    function _s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    // função que converte bytes em seus superiores
    function _size(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) {
            return '0 Byte';
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    $.fn.uploadZone = zone.methods.uploadZone;

    jQuery.extend(window, { uploadZone: zone.methods.uploadZone });

    //     // LIST BUTTONS EVENTS ============
    //     $(document).on('click', ('#' + defaults.list + ' [data-state=edit]'), function(e){
    //         let index = $(this).prop('index');
    //         $(zone.dropZone).css('display', 'none');

    //         let crop = $('<div class="crop-zone">');
    //         let cropImage = $('<img id="crop-img-preview">')

    //         $(zone.dropZone).after(crop);
    //         $(crop).append(cropImage);

    //         for(let i = 0; i < zone.list.length; i++){
    //             if(zone.list[i].index === index){
    //                 $(cropImage).attr('src', zone.list[i].path);
    //             }
    //         }

    //         let cropHtml = setCrop(cropImage);

    //         let panelHeader = $(zone.dropZone).parent().prev();
    //         let group = $('<div class="btn-group">').css('float', 'right');
    //         let cropButton = $('<span class="btn btn-primary">').append($('<i class="glyphicon glyphicon-ok">'));
    //         let moveButton = $('<span class="btn btn-primary">').append($('<i class="glyphicon glyphicon-move">'));

    //         $(group).append(cropButton, moveButton);
    //         panelHeader.append(group);
    //     });

    //     $(document).on('click', ('#' + defaults.list + ' [data-state=remove]'), function(e){
    //         let index = $(this).prop('index');

    //         for(let i = 0; i < zone.list.length; i++){
    //             if(zone.list[i].index === index){
    //                 zone.list.splice(i, 1);
    //                 ListFiles();
    //                 return; 
    //             }
    //         }
    //     });
        
    //     return zone;    
    // }

    // function setCrop(elemento) {
    //     var crop = $(elemento).cropper({
    //         aspectRatio: 1 / 1,
    //         viewMode: 1,
    //         cropBoxMovable: false,      // define se a area de crop pode ser movida
    //         cropBoxResizable: false,    // define se a area de crop pode ser redimensionada
    //         highligth: false,           // leve brilho dentro do crop

    //         dragMode: 'move',
    //     });

    //     return crop;
    // }

    // function setBlob(files, input) {
    //     for(let i = 0; i < files.length; i++){
            
    //         files[i].path = "";
            
    //         let reader = new FileReader();
    //         reader.onload = function (e) {
    //             files[i].path = e.target.result;
    //         }
    //         reader.readAsDataURL(files[i]);

    //         files[i].virtualName = guid() + files[i].name.substring(files[i].name.length - 4, files[i].name.length);
    //         zone.list.push(files[i]);
    //     }
    // }

    
})));