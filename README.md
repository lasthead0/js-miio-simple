# js-miio-simple
Simple javascript miIO protocol implementation.
Простая реализация протокола miIO на javascript.

## Состав
Файл&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Описание
--------|--------
*miio-packet.js* | *Класс с реализацией пакета miIO. Обеспечивает хранение необходимых полей, шифрование и дешифрование, сборку и разборку пакета.*
*miio-protocol.js* | *Класс с реализацией сетевого взаимодействия по протоколу miIO. Отправка сообщений (в том числе HELLO) и приём ответов от устройства.*
*miio-cli.js* | *Простой CLI с минимальным набором команд.*

## Установка
```
npm i js-miio-simple
```

## Использование
```
const miioProtocol = require('js-miio-simple');
```

```
const miIO = new miioProtocol(ip, token, [logger], [timeout]);
```
Создаём экземпляр класса для сетевого взаимодействия.

В качестве обязательных параметров передаётся `ip`-адрес и `token` устройства. Необязательный параметр `timeout` (время ожидания ответа от устройства) и `logger` (функция логирования).

`timeout` - по умолчания равен `5000 мс`.

`logger` - по умолчанию вывод в консоль `msg => console.dir(msg, {depth: null})`. Для "отключения" лога можно передать функцию без вывода, например `() => true`;

***Описание префиксов отладочных сообщений***
Префикс&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Описание
--------|--------
cmdSend_1_ | Вывод команды, переданной для отправки до установки случного `id`
cmdSend_2_ | Вывод команды, подготовленной для отправки с установленным случайным `id`
cmdSend_3_ | Вывод заголовков и данных пакета, подготовленного к отправке


#### discover()
```
const [res, msg] = await miIO.discover();
```
Функция `discover` позволяет проверить доступность устройства (отправляет HELLO-пакет устройству и ожидает ответ). Функция возвращает массив из двух элементов:

**res** (*boolean*) Если устройство доступно и ответило (и не возникло какой либо другой ошибки) примет значение `true`, иначе `false`;

**msg** (*string или Error*) Если `res == true`, то `msg` вернёт ответ устройства ([`заголовок`, `данные`]). Если `res == false`, то `msg` вернёт экземпляр ошибки (`new Error()`)


#### cmdSend(cmd)
```
const [res, msg] = await miIO.cmdSend(cmd);
```
Функция `cmdSend(cmd)` позволяет отправить устройству команду и получить ответ. Функция возвращает массив из двух элементов:

**res** (*boolean*) Если устройство доступно и ответило (и не возникло какой либо другой ошибки) примет значение `true`, иначе `false`;

**msg** (*string или Error*) Если `res == true`, то `msg` вернёт ответ устройства ([`заголовок`, `данные`]). Если `res == false`, то `msg` вернёт экземпляр ошибки (`new Error()`)

В качестве команды в параметре `cmd` должен быть передан JSON-объект `{id, method, params}` (например, `{"id":0,"method":"get_status","params":[]}`). В `id` команды можно указать любое число, оно будет заменено на случайное при отправке команды.


## Важное
Перед отправкой комманды необходимо получить `devicetype`, `deviceid` и `uptime` (для расчёта смещения времени) устройства. Для этого необходимо перед вызовом функции `cmdSend(cmd)` выполнить `discover()`. Например,
```
const miIO = new miioProtocol(ip, token);
await miIO.discover();
const [res, msg] = await miIO.cmdSend(cmd);
```


## Команды CLI
`node miio-cli.js --ip "x.x.x.x"` - выполнить проверку доступности устройства.

`node miio-cli.js --ip "x.x.x.x" --token "ffffffffffffffffffffffffffffffff" --cmd '{"id":0,"method":"get_status","params":[]}'` - отправить команду устройству.
