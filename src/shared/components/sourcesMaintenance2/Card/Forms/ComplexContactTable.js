import React from "react"
import AntTable from "../../../AntTable";
import axios from 'axios';
import {onSaveCubeData, parseForTableComplex} from "../../../../utils/cubeParser";
import {Icon, Popconfirm, Spin, Button} from "antd";
import EditableCell from "../../../SourcingPages/sources/EditableCell";
import Input from "antd/es/input/Input";
import moment from "moment";
import {updateCubeData2} from "../../../../actions/actions";
import * as uuid from "uuid";
import message from "antd/es/message/index";
class ComplexContactTable extends React.Component {
    state = {
        loading: false,
        tableData: [],
        iconLoading: false,
        loading: false,
        editable: {},
        oldTableData: []
    };

    handleChange = (e, idDataPropVal, c) => {
        let tableData = [...this.state.tableData];
        let cell = tableData.find(el => el[c].idDataPropVal == idDataPropVal);

        cell[c].valueStr = {
            kz: e.target.value,
            ru: e.target.value,
            en: e.target.value
        };
        this.setState({
            tableData: tableData
        })
    };

    edit = (idDataPropVal) => {
        let editable = {...this.state.editable};
        editable[idDataPropVal] = true;
        this.setState({editable: editable});
    };

    check = (obj, c) => {
        console.log(obj);
        debugger;
        let editable = {...this.state.editable};
        let oldTableData = [...this.state.oldTableData];
        let cell = oldTableData.find(el => el[c].idDataPropVal == obj.idDataPropVal);
        if (cell[c].valueStr !== obj.valueStr) {
            console.log('save');
            var data = [
                {
                    own: [{
                        doConst: 'doForFundAndIK',
                        doItem: String(this.props.selectedIK.id),
                        isRel: "0",
                        objData: {}
                    }
                    ],
                    props: [
                        {
                            propConst: c,
                            idDataPropVal: obj.idDataPropVal,
                            val: obj.valueStr,
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1",
                            mode: "upd",
                        }
                    ],


                    periods: [{periodType: '0', dbeg: '1800-01-01', dend: '3333-12-31'}]
                }
            ];
            updateCubeData2(
            'cubeForFundAndIK',
            moment().format('YYYY-MM-DD'),
            JSON.stringify(data),
            {},
            {}).then(res => res.success == true ? message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED')) : message.error(res.error[0].text))
        }
        else {
            console.log('equal');
        }
        editable[obj.idDataPropVal] = false;
        this.setState({editable: editable});
    };

    addRow = () => {
        this.setState({
            iconLoading: true
        });
        var nextnumber = 1;
        if (this.state.oldTableData.length > 0) {
            var numbArr = [...this.state.oldTableData.map(el => {
                debugger;
                return el['contactPersonsComplexNum'].valueStr.ru
            })
            ];
            nextnumber = Math.max(...numbArr) + 1;
        }
        else {

        }

        console.log(nextnumber);
        var data = [
            {
                own: [{
                    doConst: 'doForFundAndIK',
                    doItem: String(this.props.selectedIK.id),
                    isRel: "0",
                    objData: {}
                }
                ],
                props: [{
                    propConst: "contactPersonsComplex",
                    val: {
                        kz: `${this.props.selectedIK.id}_${uuid()}`,
                        ru: `${this.props.selectedIK.id}_${uuid()}`,
                        en: `${this.props.selectedIK.id}_${uuid()}`
                    },
                    typeProp: "71",
                    periodDepend: "2",
                    isUniq: "2",
                    mode: "ins",
                    child: [
              /*          {
                            propConst: "contactPersonsComplexNum",
                            val: {
                                kz: String(nextnumber),
                                ru: String(nextnumber),
                                en: String(nextnumber)
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        },*/
                        {


                            propConst: "contactPersonsComplexFio",
                            val: {
                                kz: 'Нет данных',
                                ru: 'Нет данных',
                                en: 'No data'
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        },
                        {
                            propConst: "contactPersonsComplexPosition",
                            val: {
                                kz: 'Нет данных',
                                ru: 'Нет данных',
                                en: 'No data'
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        },
                        {
                            propConst: "contactPersonsComplexPhone",
                            val: {
                                kz: 'Нет данных',
                                ru: 'Нет данных',
                                en: 'No data'
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        },
                        {
                            propConst: "contactPersonsComplexEmail",
                            val: {
                                kz: 'Нет данных',
                                ru: 'Нет данных',
                                en: 'No data'
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        }
                    ]
                },
                ],
                periods: [{periodType: '0', dbeg: '1800-01-01', dend: '3333-12-31'}]
            }
        ];
        updateCubeData2(
        'cubeForFundAndIK',
        moment().format('YYYY-MM-DD'),
        JSON.stringify(data),
        {},
        {}).then(res => {
            if (res.success == true) {
                this.buildComponent()
            } else {
                message.error(res.errors[0].text)
            }
        });
    }
    ;

    buildComponent = () => {
        this.setState({
            iconLoading: false,
            loading: true
        });
        const filters = {
            filterDPAnd: [
                {
                    dimConst: 'dpForFundAndIK',
                    concatType: "and",
                    conds: [
                        {
                            consts: "contactPersonsComplexNum,contactPersonsComplex,contactPersonsComplexFio,contactPersonsComplexPosition,contactPersonsComplexPhone,contactPersonsComplexEmail"
                        }
                    ]
                }
            ],
            filterDOAnd: [
                {
                    dimConst: 'doForFundAndIK',
                    concatType: "and",
                    conds: [
                        {
                            ids: String(this.props.selectedIK.id)
                        }
                    ]
                }
            ]
        };

        const fd = new FormData();
        fd.append("cubeSConst", 'cubeForFundAndIK');
        fd.append("filters", JSON.stringify(filters));
        axios.post(`/${localStorage.getItem('i18nextLng')}/cube/getCubeData`, fd).then(res => {
            var cubeData = res.data.data;
            var arrConst = ['contactPersonsComplexNum', 'contactPersonsComplex', 'contactPersonsComplexFio', 'contactPersonsComplexPosition', 'contactPersonsComplexPhone', 'contactPersonsComplexEmail'];
            var tofiConstants = this.props.tofiConstants;
            var dateIncludeOfIk = this.props.dateIncludeOfIk;
            var result = parseForTableComplex(cubeData, 'doForFundAndIK', 'dpForFundAndIK', 'dtForFundAndIK', tofiConstants, arrConst, dateIncludeOfIk);


            var oldTableData = JSON.parse(JSON.stringify(result));
            this.setState({
                cubeData: cubeData,
                oldTableData: oldTableData,
                tableData: result,
                loading: false
            })
        })
    };


    deleteRow = (rec) => {
        debugger;
        var data = [
            {
                own: [{
                    doConst: 'doForFundAndIK',
                    doItem: String(this.props.selectedIK.id),
                    isRel: "0",
                    objData: {}
                }
                ],
                props: [{
                    propConst: "contactPersonsComplex",
                    idDataPropVal: rec.key,
                    val: {
                        kz: String(rec.idName),
                        ru: String(rec.idName),
                        en: String(rec.idName)
                    },
                    typeProp: "71",
                    periodDepend: "2",
                    isUniq: "2",
                    mode: "del",
                },
                ],
                periods: [{periodType: '0', dbeg: '1800-01-01', dend: '3333-12-31'}]
            }
        ];

        updateCubeData2(
        'cubeForFundAndIK',
        moment().format('YYYY-MM-DD'),
        JSON.stringify(data),
        {},
        {}).then(res => {
            if (res.success) {
                message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED'));
            } else {
                message.error(this.props.t('PROPS_UPDATING_ERROR'));
                if (res.errors) {
                    res.errors.forEach(err => {
                        message.error(err.text);
                    });
                    return {success: false}
                }
            }
            this.buildComponent()
        });
    };

    componentDidMount() {
        this.buildComponent();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.selectedIK.id !== this.props.selectedIK.id) {
            this.buildComponent();
        }

    }


    render() {
        this.lng = localStorage.getItem("i18nextLng");
        const {contactPersonsComplex, contactPersonsComplexFio, contactPersonsComplexPosition, contactPersonsComplexPhone, contactPersonsComplexEmail} = this.props.tofiConstants;
        const columns = [
            {
                key: 'contactPersonsComplexNum',
                title: '#',
                dataIndex: 'contactPersonsComplexNum',
                width: '5%',
                render: (obj, rec, i) => obj && obj.valueStr && obj.valueStr[this.lng],
                sorter: (a, b) => a.contactPersonsComplexNum && b.contactPersonsComplexNum && parseInt(a.contactPersonsComplexNum.valueStr.ru) - parseInt(b.contactPersonsComplexNum.valueStr.ru),
                sortOrder: 'ascend'
            },
            {
                key: 'contactPersonsComplexFio',
                title: contactPersonsComplexFio.name[this.lng],
                dataIndex: 'contactPersonsComplexFio',
                width: '24%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        this.state.editable[obj.idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">
                            <Input
                            value={obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            onChange={(e) => this.handleChange(e, obj.idDataPropVal, 'contactPersonsComplexFio')}
                            onPressEnter={() => this.check(obj, 'contactPersonsComplexFio')}
                            />
                            <Icon
                            type="check"
                            className="editable-cell-icon-check"
                            onClick={() => this.check(obj, 'contactPersonsComplexFio')}
                            />
                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj.idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: 'contactPersonsComplexPosition',
                title: contactPersonsComplexPosition.name[this.lng],
                dataIndex: 'contactPersonsComplexPosition',
                width: '22%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        this.state.editable[obj.idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">
                            <Input
                            value={obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            onChange={(e) => this.handleChange(e, obj.idDataPropVal, 'contactPersonsComplexPosition')}
                            onPressEnter={() => this.check(obj, 'contactPersonsComplexPosition')}
                            />
                            <Icon
                            type="check"
                            className="editable-cell-icon-check"
                            onClick={() => this.check(obj, 'contactPersonsComplexPosition')}
                            />
                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj.idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: 'contactPersonsComplexPhone',
                title: contactPersonsComplexPhone.name[this.lng],
                dataIndex: 'contactPersonsComplexPhone',
                width: '22%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        this.state.editable[obj.idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">
                            <Input
                            value={obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            onChange={(e) => this.handleChange(e, obj.idDataPropVal, 'contactPersonsComplexPhone')}
                            onPressEnter={() => this.check(obj, 'contactPersonsComplexPhone')}
                            />
                            <Icon
                            type="check"
                            className="editable-cell-icon-check"
                            onClick={() => this.check(obj, 'contactPersonsComplexPhone')}
                            />
                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj.idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: 'contactPersonsComplexEmail',
                title: contactPersonsComplexEmail.name[this.lng],
                dataIndex: 'contactPersonsComplexEmail',
                width: '22%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        this.state.editable[obj.idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">
                            <Input
                            value={obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            onChange={(e) => this.handleChange(e, obj.idDataPropVal, 'contactPersonsComplexEmail')}
                            onPressEnter={() => this.check(obj, 'contactPersonsComplexEmail')}
                            />
                            <Icon
                            type="check"
                            className="editable-cell-icon-check"
                            onClick={() => this.check(obj, 'contactPersonsComplexEmail')}
                            />
                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj ? obj.valueStr ? obj.valueStr[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj.idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            }, {
                key: 'delete',
                title: '',
                dataIndex: 'delete',
                width: '5%',
                render: (text, record) => {
                    return (
                    <div className="editable-row-operations">
                        {
                            <span>
                                    <Popconfirm title={this.props.t('CONFIRM_REMOVE')}
                                                onConfirm={() => this.deleteRow(record)}>
                        <a style={{
                            color: '#f14c34',
                            marginLeft: '10px',
                            fontSize: '14px'
                        }}><Icon type="delete"/></a>
                      </Popconfirm>
                    </span>
                        }
                    </div>
                    );
                },
            }
        ];
        return (
        <div>
            <br/><br/>
            <h2>{contactPersonsComplex.name[this.lng]}</h2>

            <AntTable loading={this.state.loading} columns={columns}
                      hidePagination
                      dataSource={this.state.tableData}/>
            <Button type="primary" icon="plus-circle-o" loading={this.state.iconLoading}
                    onClick={this.addRow}>
                Добавить контакт
            </Button>


            <hr/>
        </div>
        )
    }
}

export default ComplexContactTable;