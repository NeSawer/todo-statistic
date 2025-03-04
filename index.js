const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');
const pathh = require('node:path');

// TODO тодушка для теста !
// TODO тодушка ! для теста !
// TODO ! тодушка ! для ! теста !

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => [path, readFile(path)]);
}

function processCommand(command) {
    let [commandName, ...args] = command.split(' ');
    let result;
    switch (commandName) {
        case 'exit':
            process.exit(0);
        
        case 'show':
            result = findTodoes(files);
            break;

        case 'important':
            result = findTodoes(files).filter(t => t.important);
            break;

        case 'name':
            const name = args[0].toLowerCase();
            result = findTodoes(files).filter(t => t.name === name);
            break;

        case 'sort':
            let secondName;
            [secondName, ...args] = args;
            switch (secondName) {
                case 'importance':
                    result = [...findTodoes(files)].sort((a, b) => b.important - a.important);
                    break;
                
                case 'user':
                    result = [...findTodoes(files)].sort((a, b) => a.name.localeCompare(b.name));
                    break;
            
                case 'date':
                    result = [...findTodoes(files)].sort((a, b) => b.date - a.date);
                    break;

                default:
                    console.log('wrong subcommand');
                    break;
            }
            break;

        case 'date':
            const date = new Date(args[0]);
            result = findTodoes(files).filter(t => t.date >= date);
            break;

        default:
            console.log('wrong command');
            break;
    }
    if (result) {
        printTable(result.map(formatTodo), ['!', 'file', 'user', 'date', 'comment'], [1, 10, 10, 10, 50]);
    }
}

function printTable(table, titles, limits) {
    table = [...table];
    const flexLimits = limits.slice().map(_ => 0);
    for (let line of [titles, ...table]) {
        for (let i = 0; i < titles.length; i++) {
            const value = line[i];
            if (value && value.length > flexLimits[i]) {
                flexLimits[i] = value.length;
            }
        }
    }
    for (let i = 0; i < limits.length; i++) {
        if (flexLimits[i] > limits[i]) {
            flexLimits[i] = limits[i];
        }
    }
    console.log(formatRow(titles, flexLimits));
    const totalLength = flexLimits.reduce((sum, a) => sum + a + 5, -5);
    console.log('-'.repeat(totalLength));
    for (let line of table) {
        console.log(formatRow(line, flexLimits));
    }
    console.log('-'.repeat(totalLength));
}

function formatRow(line, limits) {
    const result = [];
    for (let i = 0; i < line.length; i++) {
        result.push(truncateString(line[i], limits[i]).padEnd(limits[i]));
        if (i < line.length - 1) {
            result.push('  |  ');
        }
    }
    return result.join('');
}

function formatTodo(todo) {
    return [todo.important ? '!' : '', todo.path, todo.name, formatDate(todo.date), todo.message];
}

function truncateString(str, length) {
    if (str.length <= length) {
        return str;
    }
    return str.slice(0, length - 1) + '…';
}

function formatDate(date) {
    if (!date)
        return '';
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	return  `${day}-${month}-${year}`;
}

function parseTodo(raw, path) {
    const filename = pathh.basename(path);
    const items = raw.split(';');
    if (items.length !== 3) {
        return {
            raw: raw.trim(),
            name: '',
            date: null,
            message: raw.trim(),
            important: importantValue(raw),
            path: filename
        };
    }
    return {
        raw: raw.trim(),
        name: items[0].trim().toLowerCase(),
        date: new Date(items[1]),
        message: items[2].trim(),
        important: importantValue(items[2]),
        path: filename
    };
}

function importantValue(todo) {
    return todo.split('').filter(c => c == '!').length;
}

function* findTodoes(files) {
    for (let file of files) {
        for (let line of file[1].split(/\r?\n/)) {
            let bracket = '';
            let isString = false;
            for (let i = 0; i < line.length; i++) {
                if (isString && line[i] == bracket) {
                    isString = false;
                    continue;
                }
                if (!isString && ["'", '"', '`'].includes(line[i])) {
                    isString = true;
                    bracket = line[i];
                    continue;
                }
                if (!isString && line.slice(i, i + 8) === '// TODO ') {
                    yield parseTodo(line.slice(i + 8), file[0]);
                }
            }
        }
    }
}
