// 接口配置
const PUBLIC = true;

// 库
const Database = require('./util/database');
const { ResponseHelper } = require('./util/helper');
const getRawBody = require('raw-body');

// 全局变量
let db = null;

module.exports.initializer = function(context, callback) {
    try {
        // 连接数据库
        db = new Database();

        callback(null, '');
    }
    catch(error) {
        callback(error);
    }
}

module.exports.handler = function(request, response, context) {
    let rh = new ResponseHelper(request, response);

    try {
        let params = {
            method: '',
            name: '', // 资源名 不加ly_
            multi: false, // 是否获取多个资源
            fields: '', // multi为true时有效
            filter: '', // multi为true时有效，筛选条件，格式：field1:xxx,field2:yyy
            id: 0, // 获取单个资源时 id
            listMode: true, // 获取多个个资源时 是否分页
            page: 1,
            pageSize: 10,
            data: null // POST、PUT、DELETE body中的数据
        }
        
        // 初始化请求参数
    
        params.method = request.method;
        
        if(request.method == 'GET') {
            let queries = request.queries;

            if(!queries.name) {
                rh.sendErrorResponse(400, '无资源name');
            }
            else {
                params.name = queries.name;
            }
    
            if(queries.multi == 'true') {
                params.multi = true;
                if(!queries.fields) {
                    rh.sendErrorResponse(400, '无资源fields');
                }
                else {
                    params.fields = queries.fields.split(',');
                    if(queries.listMode == 'false') {
                        params.listMode = false;
                    }
                    else {
                        if(queries.page) {
                            params.page = parseInt(queries.page);
                        }
        
                        if(queries.page_num) {
                            params.pageSize = parseInt(queries.page_num);
                        }
                    }   
                }
            }
            else {
                if(!queries.id) {
                    rh.sendErrorResponse(400, '无资源id');
                }
                else {
                    params.id = parseInt(queries.id);
                }
            }

            handleResource();
        }
        else {
            getRawBody(request, function(error, body) {
                let data = JSON.parse(body.toString('utf8'));
                params.name = data.name;
                if(params.method != 'POST') {
                    if(!data.id) {
                        rh.sendErrorResponse(400, '无资源id');
                    }
                    else {
                        params.id = data.id;
                    }
                }
                if(data.data) {
                    params.data = data.data;
                }
                handleResource();
            })
        }

        function handleResource() {
            // 获取资源表信息
            db.query(`desc ly_${params.name}`)
            .then(fields => {
                const systemField = ['delete'];
        
                let deleteField = fields.find(item => {
                    return item.Field == 'delete'
                })
        
                // 构造SQL语句
        
                let sql = '';
        
                if(params.method == 'GET') {
                    if(!params.multi) {
                        let fieldNames = '';
                        fields.forEach(item => {
                            if(systemField.indexOf(item.Field) == -1) {
                                fieldNames += item.Field + ',';
                            }
                        })
                        fieldNames = fieldNames.substring(0, fieldNames.length - 1);
                        
                        sql = `select ${fieldNames} from ly_${params.name} where id=${params.id}`;

                        if(deleteField) {
                            sql += ' and `delete`="0"';
                        }
                    }
                    else {
                        let queryFields = [ ...params.fields ];
                        queryFields.splice(0, 0, 'id');
                        
                        let fieldNames = '';
                        queryFields.forEach(item => {
                            fieldNames += item + ',';
                        })
                        fieldNames = fieldNames.substring(0, fieldNames.length - 1);
        
                        if(params.listMode) {
                            sql = `select ${fieldNames} from ly_${params.name}`;
                            if(deleteField) {
                                sql += ' where `delete`="0"';
                            }
                            sql += ` limit ${(params.page - 1) * 10},${params.pageSize}`;
                        }
                        else {
                            sql = `select ${fieldNames} from ly_${params.name}`;
                            if(deleteField) {
                                sql += ' where `delete`="0"';
                            }
                            sql += 'limit 0,50';
                        }
                    }
                }
                else if(params.method == 'POST') {
                    let fieldNames = '',
                        fieldValues = '';

                    for(let key in params.data) {
                        if(systemField.indexOf(key) == -1) {
                            fieldNames += key + ',';
                            fieldValues += `"${params.data[key]}",`;
                        }
                    }
                    fieldNames = fieldNames.substring(0, fieldNames.length - 1);
                    fieldValues = fieldValues.substring(0, fieldValues.length - 1);

                    sql = `insert into ly_${params.name} (${fieldNames}) values (${fieldValues})`;
                }
                else if(params.method == 'PUT') {
                    let str = '';

                    for(let key in params.data) {
                        if(systemField.indexOf(key) == -1) {
                            str += `${key} = "${params.data[key]}",`;
                        }
                    }
                    str = str.substring(0, str.length - 1);

                    sql = `update ly_${params.name} set ${str} where id=${params.id}`;
                }
                else if(params.method == 'DELETE') {
                    sql = `update ly_${params.name} set \`delete\`="1" where id=${params.id}`;
                }


                // 数据库查询
                
                db.query(sql)
                .then(results => {
                    if(params.method == 'GET') {
                        let filterResults = results.filter(item => {
                            return item.delete !== 1
                        })

                        if(!params.multi) {
                            rh.sendDataResponse(filterResults.length ? filterResults[0] : {});
                        }
                        else {
                            if(params.listMode) {
                                let sql = `select count(*) as total from ly_${params.name}`;

                                if(deleteField) {
                                    sql += ' where `delete`="0"';
                                }

                                db.query(sql)
                                .then(countResults => {
                                    rh.sendListResponse(filterResults, countResults[0].total);
                                })
                                .catch(error => {
                                    rh.sendErrorResponse(500, error);
                                })
                            }
                            else {
                                rh.sendListResponse(filterResults, filterResults.length);
                            }
                        }
                    }
                    else if(params.method == 'POST') {
                        rh.sendDataResponse({
                            id: results.insertId
                        })
                    }
                    else {
                        rh.sendDataResponse({})
                    }
                })
                .catch(error => {
                    rh.sendErrorResponse(500, error);
                })
            })
            .catch(error => {
                rh.sendErrorResponse(500, error);
            })
        }
    }
    catch(error) {
        rh.sendErrorResponse(500, error);
    }
}