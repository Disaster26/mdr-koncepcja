(function(){
  'use strict';
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

  /* menu mobilne */
  var ham=$('.ham'),panel=$('#panel');
  function zamknij(){panel.classList.remove('otw');ham.setAttribute('aria-expanded','false')}
  ham.addEventListener('click',function(){var o=!panel.classList.contains('otw');panel.classList.toggle('otw',o);ham.setAttribute('aria-expanded',String(o))});
  $$('#panel a').forEach(function(a){a.addEventListener('click',zamknij)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')zamknij()});

  /* dolny pasek po przewinięciu za przyciski hero */
  var mob=$('.mob'),cta=$('.hero-cta');
  if('IntersectionObserver' in window&&mob&&cta){
    new IntersectionObserver(function(w){
      var e=w[0];var pod=!e.isIntersecting&&e.boundingClientRect.top<0;
      mob.classList.toggle('widac',pod);mob.setAttribute('aria-hidden',String(!pod));
      $$('a',mob).forEach(function(a){a.tabIndex=pod?0:-1});
    },{threshold:0}).observe(cta);
    /* w kalkulatorze pasek pokazuje bieżącą kwotę, dopóki paragon nie jest na ekranie */
    var wKreatorze=false,paragonWidac=false;
    var ustawKalk=function(){mob.classList.toggle('kalk',wKreatorze&&!paragonWidac)};
    new IntersectionObserver(function(w){wKreatorze=w[0].isIntersecting;ustawKalk()},{rootMargin:'-30% 0px -30% 0px'}).observe($('#kreator'));
    new IntersectionObserver(function(w){paragonWidac=w[0].isIntersecting;ustawKalk()},{rootMargin:'0px 0px -25% 0px'}).observe($('#wycena'));
  }

  /* zakładki cennika */
  $$('.zakladki button').forEach(function(b){
    b.addEventListener('click',function(){
      $$('.zakladki button').forEach(function(x){x.setAttribute('aria-selected',String(x===b))});
      $$('.tab').forEach(function(t){t.hidden=t.id!=='t-'+b.dataset.t});
    });
  });

  /* ===== kalkulator wg cennika mdr-biuro.pl (netto) ===== */
  var CENY={
    ryczalt:[170,190,210,230,250],
    kpir:[220,240,260,280,300],
    pelna:[600,750,850,950,1050],
    ponad50:25, vat7:55, vatUe:50, oss:60, zus:50, placa:50
  };
  var NAZWA={jdg:'Jednoosobowa działalność',sc:'Spółka cywilna / jawna',zoo:'Spółka z o.o. / komandytowa',ngo:'Fundacja / stowarzyszenie'};
  var stan={forma:'jdg',podatek:'kpir',vat:'nie'};
  var prac=0;

  function zl(n){var c=Math.round(n*100)/100,cz=Math.floor(c),gr=Math.round((c-cz)*100);var t=String(cz).replace(/\B(?=(\d{3})+(?!\d))/g,' ');return t+(gr?','+(gr<10?'0':'')+gr:'')+' zł'}
  function przedzial(d){return d<=10?0:d<=20?1:d<=30?2:d<=40?3:4}
  function ksiegowosc(rodzaj,d){
    var i=przedzial(d),baza=CENY[rodzaj][i];
    if(d>50){
      if(rodzaj==='pelna')return {kwota:CENY.pelna[4],indyw:true};
      return {kwota:baza+Math.ceil((d-50)/10)*CENY.ponad50,ponad:true};
    }
    return {kwota:baza};
  }
  function etykietaPrzedz(d){return d<=10?'0-10':d<=20?'11-20':d<=30?'21-30':d<=40?'31-40':d<=50?'41-50':'pow. 50'}

  function pelnaKs(){return stan.forma==='zoo'||stan.forma==='ngo'}

  function licz(rodzaj){
    var d=+$('#dok').value,poz=[],k=ksiegowosc(rodzaj,d);
    var nazwa=rodzaj==='pelna'?'Pełna księgowość':rodzaj==='kpir'?'KPiR':'Ryczałt';
    poz.push([nazwa+' ('+etykietaPrzedz(d)+' dok.)',k.kwota]);
    if(k.ponad)poz[0][0]=nazwa+' ('+d+' dok., w tym dopłata ponad 50)';
    if(stan.vat==='tak'){
      poz.push(['Deklaracja VAT-7',CENY.vat7]);
      if($('#vatUe').checked)poz.push(['Deklaracja VAT-UE',CENY.vatUe]);
      if(rodzaj!=='pelna'&&$('#oss').checked)poz.push(['Deklaracja OSS',CENY.oss]);
    }
    if(prac>0)poz.push(['Płace + ZUS: '+prac+' '+(prac===1?'osoba':prac<5?'osoby':'osób'),prac*CENY.placa]);
    if(rodzaj!=='pelna'&&$('#zus').checked){var w=stan.forma==='sc'?2:1;poz.push(['ZUS '+(w>1?'wspólników (2 os.)':'właściciela'),w*CENY.zus])}
    var suma=poz.reduce(function(s,p){return s+p[1]},0);
    return {poz:poz,suma:suma,indyw:!!k.indyw,nazwa:nazwa};
  }

  function htmlWyniku(w){
    var h='<p class="poz poz-sek"><span>'+NAZWA[stan.forma]+'</span></p>';
    w.poz.forEach(function(p){h+='<p class="poz"><span>'+p[0]+'</span><span>'+zl(p[1])+'</span></p>'});
    h+='<div class="suma"><p class="poz poz-glowna"><span>Razem netto / mies.</span><span>'+(w.indyw?'od ':'')+zl(w.suma)+'</span></p>';
    h+='<p class="poz"><span>Brutto z 23% VAT</span><span>'+(w.indyw?'od ':'')+zl(Math.round(w.suma*123)/100)+'</span></p></div>';
    if(w.indyw)h+='<p class="alt">Powyżej 50 dokumentów pełne księgi wyceniamy <b>indywidualnie</b>. Podana kwota to stawka dla 41-50 dokumentów.</p>';
    return h;
  }

  var ostatni='';
  function odswiez(){
    var d=+$('#dok').value;
    $('#dokWart').textContent=d>=120?'120+':d;
    var r=$('#dok');r.style.setProperty('--p',((d-r.min)/(r.max-r.min)*100)+'%');
    var pelna=pelnaKs();
    $('#krokPodatek').hidden=pelna;
    var nr=pelna?2:3;
    $('#nrDok').textContent=nr;$('#nrVat').textContent=nr+1;$('#nrPrac').textContent=nr+2;
    $('#vatDod').hidden=stan.vat!=='tak';
    $('#ossWrap').hidden=pelna;
    $('#zusWrap').hidden=pelna;
    $('#zusIle').textContent=stan.forma==='sc'?'(2 wspólników)':'';
    $('#podpWyciag').textContent=pelna?'Przy pełnych księgach 5 pozycji wyciągu bankowego liczymy jako 1 dokument.':'';
    var pp=$('#podpPodatek');
    if(stan.forma==='sc')pp.textContent='Spółka cywilna lub jawna osób fizycznych może prowadzić KPiR, dopóki roczne przychody nie przekroczą 2 mln euro.';
    else if(stan.podatek==='nie-wiem')pp.textContent='Porównamy ryczałt i KPiR. Formę opodatkowania pomożemy dobrać przy rozmowie.';
    else pp.textContent='';

    var h,tekst;
    if(pelna){
      var w=licz('pelna');h=htmlWyniku(w);tekst=opis(w);
      if(stan.forma==='ngo')h+='<p class="alt">Mniejsze organizacje mogą czasem prowadzić <b>uproszczoną ewidencję</b> przychodów i kosztów. Wtedy koszt wyceniamy indywidualnie.</p>';
    }else if(stan.podatek==='nie-wiem'){
      var a=licz('ryczalt'),b=licz('kpir');
      h=htmlWyniku(a)+'<p class="alt">Na <b>KPiR</b> (skala lub liniowy) ten sam zakres to <b>'+zl(b.suma)+' netto</b> miesięcznie.</p>';
      tekst=opis(a)+'\nDla porównania KPiR: '+zl(b.suma)+' netto / mies.';
    }else{
      var c=licz(stan.podatek);h=htmlWyniku(c);tekst=opis(c);
    }
    $('#wynik').innerHTML=h;
    var sumaEl=$('#wynik .poz-glowna span:last-child');
    if(sumaEl){var ms=$('#mobSuma');if(ms.textContent!==sumaEl.textContent){ms.textContent=sumaEl.textContent;ms.classList.remove('tik');void ms.offsetWidth;ms.classList.add('tik')}}
    ostatni=tekst;
    var temat='Zapytanie o obsługę księgową - '+NAZWA[stan.forma];
    var tresc='Dzień dobry,\n\nproszę o ofertę obsługi księgowej. Wycena z kalkulatora na stronie:\n\n'+tekst+'\n\nImię i nazwisko:\nTelefon:\nNIP (opcjonalnie):\n\nPozdrawiam';
    $('#mailZap').href='mailto:mdr.biurorachunkowe@gmail.com?subject='+encodeURIComponent(temat)+'&body='+encodeURIComponent(tresc);
  }
  function opis(w){
    var t='Forma: '+NAZWA[stan.forma]+'\nDokumenty miesięcznie: '+$('#dok').value+'\n';
    w.poz.forEach(function(p){t+='- '+p[0]+': '+zl(p[1])+'\n'});
    t+='Razem: '+(w.indyw?'od ':'')+zl(w.suma)+' netto / mies. ('+(w.indyw?'od ':'')+zl(Math.round(w.suma*123)/100)+' brutto)';
    return t;
  }

  $$('.chipy').forEach(function(g){
    g.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      $$('button',g).forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b))});
      stan[g.dataset.p]=b.dataset.v;odswiez();
    });
    $$('button',g).forEach(function(x){x.setAttribute('aria-pressed',String(x.classList.contains('on')))});
  });
  $('#dok').addEventListener('input',odswiez);
  ['#vatUe','#oss','#zus'].forEach(function(s){$(s).addEventListener('change',odswiez)});
  $$('.licznik button').forEach(function(b){
    b.addEventListener('click',function(){prac=Math.max(0,Math.min(50,prac+ +b.dataset.d));$('#prac').textContent=prac;odswiez()});
  });
  $('#kopiuj').addEventListener('click',function(){
    var b=this,ok=function(){b.textContent='Skopiowano';setTimeout(function(){b.textContent='Kopiuj wycenę'},1800)};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ostatni).then(ok,function(){b.textContent='Zaznacz i skopiuj'});
    else b.textContent='Zaznacz i skopiuj';
  });

  /* skróty z kart usług ustawiają formę w kalkulatorze */
  $$('[data-forma]').forEach(function(a){
    a.addEventListener('click',function(){
      var b=$('.chipy[data-p="forma"] button[data-v="'+a.dataset.forma+'"]');if(b)b.click();
    });
  });

  odswiez();
})();
