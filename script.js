$(document).ready(function(){

    // chamando meu plugin
    var zone = $('.upload-zone').uploadZone({
        list: 'lista-aqui'
    });

    console.log(zone);
});