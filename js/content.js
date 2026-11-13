/* Contenido del juego. t = tema (1-4) de los apuntes. En cada pregunta, la respuesta correcta es SIEMPRE la primera opción (el juego las baraja). */
window.CONTENT = {
  teams: [
    { name: 'Fuego', icon: 'flame', color: '#e2552f' },
    { name: 'Agua', icon: 'drop', color: '#4c9cc4' },
    { name: 'Aire', icon: 'wind', color: '#eadbb8' },
    { name: 'Tierra', icon: 'leaf', color: '#97a84a' },
    { name: 'Átomos', icon: 'atom', color: '#b07cc0' }
  ],

  rounds: [
    { n: 1, icon: 'bolt', title: 'Atrévete a saber', sub: 'Calentamiento',
      how: ['Responde en tu móvil.', 'Acertar da puntos; acertar rápido, más.', 'Tu equipo suma la media de sus jugadores: nadie se queda fuera.'] },
    { n: 2, icon: 'duel', title: 'Duelos relámpago', sub: 'Dos opciones, siete segundos',
      how: ['Una frase, dos bandos.', 'Solo 7 segundos: sin pensarlo demasiado… o sí.', 'Ojo, que hay trampas.'] },
    { n: 3, icon: 'hand', title: 'Manos a la pantalla', sub: 'Un equipo entero en la PIM',
      how: ['Cada equipo sale a la pantalla y coloca las tarjetas en su sitio.', 'Cada fallo resta. Terminar rápido suma.', 'Los demás apuestan desde el móvil: ¿cuántos fallos tendrán?'] },
    { n: 4, icon: 'lens', title: 'Detectores de bulos', sub: 'Se puede (y se debe) investigar',
      how: ['Verán una afirmación. Tienen 50 segundos.', 'Pueden buscar en internet y discutirlo con el equipo.', '¿Es verdad, es falso… o no se puede comprobar? No vale la velocidad: vale acertar.'] },
    { n: 5, icon: 'temple', title: 'El ágora', sub: 'Aquí no hay respuesta correcta: hay razones',
      how: ['Vota en tu móvil lo que piensas de verdad.', 'El oráculo de Delfos elegirá quién defiende cada postura.', 'Una buena razón da puntos extra al equipo.'] },
    { n: 6, icon: 'sun', title: 'La salida', sub: '¿Quién soy? · Puntos dobles',
      how: ['Un filósofo se describe con 4 pistas, de difícil a fácil.', 'Cuanto antes respondas, más puntos… pero solo tienes UN intento.', 'Última oportunidad para salir de la caverna.'] }
  ],

  /* Ronda 1 — test (20 s) */
  quiz: [
    { t: 1, q: '«Filosofía» significa, literalmente…',
      o: ['Amor a la sabiduría', 'Posesión de la sabiduría', 'Arte de convencer', 'Ciencia de los dioses'],
      e: 'Filo = amor, sofía = sabiduría. El filósofo no la tiene: la busca.' },
    { t: 1, q: '¿Cuál de estas preguntas es filosófica?',
      o: ['¿Qué es un amigo?', '¿Cuántos habitantes tiene El Sauzal?', '¿En qué año murió Sócrates?', '¿A qué temperatura hierve el agua?'],
      e: 'Las otras tres se contestan con un dato. Esta pide una definición y razones.' },
    { t: 1, q: '«Atrévete a saber»: pensar por cuenta propia en vez de aceptar lo que dicen otros. ¿De quién es el lema?',
      o: ['Kant', 'Sócrates', 'Platón', 'Aristóteles'],
      e: 'Es de Kant, mucho después de los griegos. (Sócrates: «solo sé que no sé nada»).' },
    { t: 1, q: '¿Por qué la filosofía nació precisamente en ciudades como Mileto?',
      o: ['Eran puertos con comercio, contacto con otros pueblos y discusión pública', 'Porque los griegos eran más inteligentes que los demás', 'Porque allí no existían los mitos', 'Porque el oráculo de Delfos lo ordenó'],
      e: 'Quien conoce muchos mitos distintos empieza a preguntarse cuál es el verdadero.' },
    { t: 2, q: 'Anaximandro dijo que ni el agua ni ningún otro elemento podía ser el arché. ¿Por qué?',
      o: ['Porque los elementos son contrarios entre sí: ninguno puede originar a los demás', 'Porque los dioses no lo permitirían', 'Porque solo existen átomos y vacío', 'Porque el cambio es imposible'],
      e: 'Por eso propuso lo indefinido: el ápeiron.' },
    { t: 2, q: '«Nadie se baña dos veces en el mismo río». No está en los apuntes, pero… ¿qué filósofo firmaría esta frase?',
      o: ['Heráclito', 'Parménides', 'Tales', 'Protágoras'],
      e: 'Heráclito: todo está en continuo devenir. El río cambia… y tú también.' },
    { t: 2, q: 'Tales, Anaximandro y Anaxímenes se equivocaron los tres. ¿Por qué decimos entonces que con ellos empieza la filosofía?',
      o: ['Porque no recurrieron a ningún dios y dieron razones que se podían discutir', 'Porque fueron los primeros en escribir mitos', 'Porque al final acertaron con el agua', 'Porque nadie se atrevió a llevarles la contraria'],
      e: 'Lo importante no fue la respuesta, sino la forma de responder: con logos.' },
    { t: 3, q: 'Sócrates buscaba definiciones. Si le preguntas «¿qué es la valentía?» y alguien responde «Aquiles era valiente», ¿qué le diría?',
      o: ['Eso es un ejemplo, no una definición: dice cuál, no dice qué', 'Correcto, has definido la valentía', 'Eso depende de cada ciudad', 'Págame y te lo explico'],
      e: 'Un ejemplo no es una definición. Sócrates seguiría preguntando.' },
    { t: 3, q: '¿De qué acusaron a Sócrates en el juicio del 399 a. C.?',
      o: ['De corromper a los jóvenes y no creer en los dioses de la ciudad', 'De cobrar demasiado por sus clases', 'De escribir libros contra la democracia', 'De defender que la verdad es relativa'],
      e: 'Ni cobraba, ni escribió nada, ni era relativista: esos eran los sofistas.' },
    { t: 4, q: 'En 1687 Newton publicó la ley de la gravedad en un libro titulado «Principios matemáticos de la filosofía natural». ¿Qué nos enseña ese título?',
      o: ['Que durante siglos ciencia y filosofía fueron lo mismo', 'Que Newton no era un científico de verdad', 'Que la gravedad es solo una opinión', 'Que la ciencia es más antigua que la filosofía'],
      e: 'Las ciencias nacieron dentro de la filosofía y se separaron al tener su propio método.' }
  ],

  /* Ronda 2 — duelos (7 s). a = índice del bando correcto */
  duels: [
    { sides: ['MITO', 'LOGOS'], icons: ['bolt', 'sun'], t: 2, items: [
      { s: '«El Teide escupe fuego porque Guayota está furioso».', a: 0, e: 'Una voluntad lo explica todo: mito.' },
      { s: '«El magma sube porque es menos denso que la roca que lo rodea».', a: 1, e: 'Causas naturales que se pueden comprobar.' },
      { s: '«Siempre se ha contado así, y eso no se discute».', a: 0, e: 'Tradición y autoridad: no se discute.' },
      { s: '«Si me demuestras que me equivoco, cambio de idea».', a: 1, e: 'El logos se discute, y por eso mejora.' },
      { s: '«Todo está hecho de agua, porque todo lo vivo la necesita».', a: 1, e: '¡Trampa! Tales se equivocó, pero dio una razón sin dioses: es logos.' },
      { s: '«Este año no llueve: es un castigo».', a: 0, e: '¿Castigo de quién? Una voluntad: mito.' }
    ] },
    { sides: ['SOFISTAS', 'SÓCRATES'], icons: ['coin', 'ask'], t: 3, items: [
      { s: '«Te enseño a ganar cualquier juicio. Son 50 dracmas».', a: 0, e: 'Los sofistas cobraban por enseñar retórica.' },
      { s: '«No me des ejemplos: dime QUÉ ES la justicia».', a: 1, e: 'Sócrates busca definiciones.' },
      { s: '«Lo justo en Atenas no tiene por qué serlo en Esparta».', a: 0, e: 'Relativismo: las leyes (nomos) son acuerdos de cada pueblo.' },
      { s: '«Yo no sé nada… explícamelo tú, que sabes».', a: 1, e: 'Ironía socrática: fingir no saber para que el otro se explique.' },
      { s: '«Con un buen discurso largo, la asamblea es tuya».', a: 0, e: 'Sofistas: discurso largo para persuadir y ganar.' },
      { s: '«El hombre es la medida de todas las cosas».', a: 0, e: 'Protágoras, el sofista más famoso.' },
      { s: '«Una vida sin examen no es vida».', a: 1, e: 'Sócrates, en su propio juicio.' }
    ] },
    { sides: ['HERÁCLITO', 'PARMÉNIDES'], icons: ['flame', 'sphere'], t: 2, items: [
      { s: '«Todo está en continuo devenir, como el fuego».', a: 0, e: 'Heráclito: todo cambia.' },
      { s: '«Lo que es, es, y no puede dejar de ser».', a: 1, e: 'Parménides: el ser no cambia.' },
      { s: '«El cambio no es un caos: sigue una medida, el logos».', a: 0, e: 'Heráclito: cambia, pero con orden.' },
      { s: '«No te fíes de tus ojos: solo la razón llega a la verdad».', a: 1, e: 'Parménides. Neo y el prisionero de la caverna estarían de acuerdo.' }
    ] }
  ],

  /* Ronda 3 — tableros para la PIM. cards: [texto, índice de la casilla] */
  boards: [
    { t: 2, title: '¿De qué está hecho todo?', bins: ['Tales', 'Anaximandro', 'Anaxímenes', 'Empédocles', 'Anaxágoras', 'Demócrito'],
      cards: [['El agua', 0], ['Lo indefinido (ápeiron)', 1], ['El aire, que se condensa y se enrarece', 2], ['Cuatro raíces', 3], ['Amor y Odio', 3], ['El Nous: una inteligencia que ordena', 4], ['Átomos y vacío', 5], ['Nadie junta las piezas: chocan y se enganchan', 5]] },
    { t: 2, title: 'Cambio, ser y sombras', bins: ['Heráclito', 'Parménides', 'Platón'],
      cards: [['Devenir', 0], ['Como el fuego, que nunca está quieto', 0], ['Cambia según una medida', 0], ['El cambio es imposible', 1], ['Lo que ven los mortales es apariencia', 1], ['No nace ni perece', 1], ['Prisioneros que toman sombras por la realidad', 2], ['Fue discípulo de Sócrates y escribió sobre él', 2]] },
    { t: 3, title: 'Ganar la discusión o buscar la verdad', bins: ['Sofistas', 'Sócrates'],
      cards: [['La verdad es relativa', 0], ['La verdad se busca en común', 1], ['Cobran', 0], ['Gratis: pregunta a cualquiera', 1], ['Discurso largo', 0], ['Diálogo: pregunta y respuesta', 1], ['Hablar para persuadir y ganar', 0], ['Hablar para saber y vivir mejor', 1], ['Retórica', 0], ['Mayéutica', 1]] },
    { t: 3, title: 'Diccionario exprés', bins: ['Arché', 'Nomos', 'Retórica', 'Relativismo', 'Mayéutica', 'Ironía', 'Docta ignorancia', 'Devenir'],
      cards: [['Principio primero: origen y materia a la vez', 0], ['Ley o costumbre acordada entre personas', 1], ['Arte de persuadir con la palabra', 2], ['No hay verdades válidas para todos', 3], ['Ayudar a otro a descubrir por sí mismo, con preguntas', 4], ['Fingir que no se sabe para que el otro se explique', 5], ['Saber que no se sabe', 6], ['Cambio continuo: llegar a ser y dejar de ser', 7]] },
    { t: 4, title: '¿Qué clase de saber es?', bins: ['Ciencia', 'Pseudociencia', 'Pregunta filosófica', 'Saber de oficio'],
      cards: [['Medir a qué temperatura hierve el agua en el Teide', 0], ['Publicar el experimento para que cualquiera lo repita', 0], ['«Tu horóscopo dice que hoy tendrás suerte»', 1], ['Un zumo que «elimina toxinas»', 1], ['¿Es justo juzgar a alguien por sus genes?', 2], ['¿Qué es conocer?', 2], ['El alfarero: «siempre se ha hecho así»', 3], ['Hacer el mojo como lo hacía la abuela', 3]] }
  ],

  /* Ronda 4 — bulos (50 s, se puede buscar). a: 0 = verdad comprobada, 1 = falso/refutado, 2 = no se puede comprobar */
  buloOpts: ['Es verdad: está comprobado', 'Es falso: está refutado', 'No se puede comprobar'],
  bulos: [
    { t: 4, s: '«En la cima del Teide, el agua hierve a menos de 90 °C».', a: 0,
      e: 'Verdad: a 3.715 m hay menos presión y el agua hierve a unos 88 °C. Y lo mejor: cualquiera puede subir con un termómetro y comprobarlo.', k: 'Pregunta 1: ¿lo puede comprobar cualquiera, sin dones especiales?' },
    { t: 4, s: '«Isaac Newton fue el primero en llamarse a sí mismo "científico"».', a: 1,
      e: 'Falso: la palabra «científico» no se inventó hasta 1833, y Newton murió en 1727. Él se consideraba «filósofo natural».', k: 'Pregunta 3: ¿con qué pruebas? Una fecha basta para refutarlo.' },
    { t: 4, s: '«En mi garaje vive un dragón invisible. No pesa, no hace ruido, no deja huellas y ningún aparato puede detectarlo».', a: 2,
      e: 'No se puede comprobar: nada de lo que pase podría desmentirlo. Ojo: eso no demuestra que sea falso… pero tampoco es ciencia.', k: 'Pregunta 2: ¿qué tendría que pasar para que cambiara de opinión? «Nada» → no es ciencia.' },
    { t: 4, s: '«Un rayo nunca cae dos veces en el mismo sitio».', a: 1,
      e: 'Falso: los rayos caen muchas veces en los mismos puntos altos. Para eso existen los pararrayos.', k: 'Pregunta 4: ¿explica los datos que no encajan? Un solo pararrayos lo desmiente.' },
    { t: 4, s: '«Todo lo que te pasa, lo bueno y lo malo, ocurre porque el universo así lo quería».', a: 2,
      e: 'No se puede comprobar: pase lo que pase, siempre «encaja». Explica todo después de que ocurra y no predice nada. Fíjate: una voluntad que lo explica todo… suena a mito.', k: 'Pregunta 5: ¿ha predicho algo nuevo o solo explica lo que ya ha pasado?' }
  ],

  /* Ronda 5 — dilemas */
  polls: [
    { t: 2, theme: 'matrix', q: 'Morfeo te ofrece dos pastillas. ¿Cuál te tomas?',
      o: ['ROJA: conocer la verdad, aunque sea dura', 'AZUL: seguir en una ilusión cómoda y feliz'],
      think: ['¿Qué haría el prisionero que salió de la caverna de Platón?', '¿Qué diría Parménides de lo que nos muestran los sentidos?', 'Y si la ilusión te hace feliz… ¿por qué importa la verdad?'] },
    { t: 4, theme: 'gattaca', q: 'Como en Gattaca: una empresa lee tu ADN y contrata solo a quien tiene «los mejores genes». ¿Es justo?',
      o: ['Sí: es elegir con datos', 'No: un dato no mide a una persona', 'Depende'],
      think: ['¿Qué pueden estimar los datos genéticos y qué no pueden determinar?', '¿Esta pregunta se puede resolver midiendo algo en un laboratorio?', 'Entonces… ¿es una pregunta científica o filosófica?'] },
    { t: 3, theme: 'agora', q: 'Protágoras contra Sócrates. ¿Con quién estás?',
      o: ['Protágoras: cada uno tiene su verdad', 'Sócrates: hay verdades que valen para todos, y hay que buscarlas'],
      think: ['Si «todo es relativo»… ¿esa frase también es relativa?', 'Si cada uno tiene su verdad, ¿para qué sirve discutir?', '¿Las leyes son nomos (acuerdo) o physis (naturaleza)?'] }
  ],

  /* Ronda 6 — ¿quién soy? */
  names: ['Tales', 'Anaximandro', 'Anaxímenes', 'Heráclito', 'Parménides', 'Empédocles', 'Anaxágoras', 'Demócrito', 'Protágoras', 'Sócrates', 'Platón', 'Kant'],
  whoami: [
    { t: 2, a: 'Demócrito', clues: [
      'Corta un trozo de queso por la mitad, y otra vez, y otra… Yo digo que llegará un momento en que ya no podrás cortar más.',
      'En mi mundo nadie ordena nada: las piezas se mueven, chocan y se enganchan solas.',
      'Me cuentan entre los pluralistas: no hay un solo principio, sino muchísimas piezas.',
      'Solo existen los átomos y el vacío.'] },
    { t: 3, a: 'Protágoras', clues: [
      'Viajo de ciudad en ciudad. Mis clases no son baratas, pero salen rentables.',
      'Lo que a ti te parece verdadero, es verdadero para ti.',
      'Soy de Abdera y enseño retórica. Platón recogió mi frase más famosa.',
      'El hombre es la medida de todas las cosas.'] },
    { t: 2, a: 'Anaximandro', clues: [
      'Lo húmedo y lo caliente son contrarios: ninguno puede ser el padre del otro.',
      'Busco, como mis vecinos, el principio de todas las cosas.',
      'Soy de Mileto, pero no elegí ni el agua ni el aire.',
      'El arché es lo indefinido: el ápeiron.'] },
    { t: 2, a: 'Parménides', clues: [
      'Tus ojos te dicen que las cosas cambian. Tus ojos se equivocan.',
      'Neo y el prisionero de la caverna entenderían bien lo que digo.',
      'Heráclito y yo respondimos justo lo contrario a la misma pregunta.',
      'Lo que es, es, y no puede dejar de ser: el cambio es imposible.'] },
    { t: 3, a: 'Sócrates', clues: [
      'Mi oficio se parece al de una comadrona… pero yo no ayudo a nacer bebés.',
      'No escribí ni una línea: lo que sabes de mí lo contó un discípulo.',
      'Un oráculo dijo que nadie era más sabio que yo. Fui a comprobarlo preguntando.',
      'Solo sé que no sé nada.'] }
  ],

  temas: ['', 'Qué es la filosofía', 'Del mito al logos', 'Sofistas y Sócrates', 'Ciencia y pseudociencias']
};
