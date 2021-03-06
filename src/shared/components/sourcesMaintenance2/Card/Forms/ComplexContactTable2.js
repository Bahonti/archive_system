import React from "react"
import AntTable from "../../../AntTable";
import axios from 'axios';
import {
    onSaveCubeData, parseCube_new, parseForTable,
    parseForTableComplex
} from "../../../../utils/cubeParser";
import {Icon, Popconfirm, Spin, Button, Col, Row} from "antd";
import EditableCell from "../../../SourcingPages/sources/EditableCell";
import Input from "antd/es/input/Input";
import moment from "moment";
import {updateCubeData2} from "../../../../actions/actions";
import * as uuid from "uuid";
import message from "antd/es/message/index";
class ComplexContactTable2 extends React.Component {
    state = {
        tableData: [],
        iconLoading: false,
        loading: false,
        editable: {},
        oldTableData: []
    };

    handleChange = (e, idDataPropVal, c) => {
        let tableData = [...this.state.tableData];
        let cell = tableData.find(el => el[this.props.tofiConstants[c].id][0].idDataPropVal == idDataPropVal);

        cell[this.props.tofiConstants[c].id][0].valueLng = {
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
        let editable = {...this.state.editable};
        let oldTableData = [...this.state.oldTableData];
        let cell = oldTableData.find(el => el[this.props.tofiConstants[c].id][0].idDataPropVal == obj.idDataPropVal);
        var val1 = JSON.stringify(cell[this.props.tofiConstants[c].id][0].valueLng);
        var val2 = JSON.stringify(obj.valueLng);
        if (val1 !== val2) {
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
                            val: obj.valueLng,
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
            {}).then(res => res.success == true ? message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED')) : message.error(res.errors[0].text))
        }
        else {

        }
        editable[obj.idDataPropVal] = false;
        this.setState({editable: editable});
    };

    addRow = () => {
        const showLoad = message.loading('Сохранение', 0);
        this.setState({
            iconLoading: true
        });
        var nextnumber = 1;
        if (this.state.oldTableData && this.state.oldTableData.length > 0) {
            var numbArr = [...this.state.oldTableData.map(el => {
                return el[this.props.tofiConstants['contactPersonsComplexNum'].id][0].valueLng.ru
            })
            ];
            nextnumber = Math.max(...numbArr) + 1;
        }
        else {

        }

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
                        {
                            propConst: "contactPersonsComplexNum",
                            val: {
                                kz: String(nextnumber),
                                ru: String(nextnumber),
                                en: String(nextnumber)
                            },
                            typeProp: "315",
                            periodDepend: "2",
                            isUniq: "1"
                        },
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
                showLoad();
                message.success('Добавлено');
                this.buildComponent()
            } else {
                showLoad();
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
            ],
            filterDTOr: [
                {
                    dimConst: 'dtForFundAndIK',
                    conds: [
                        {
                            ids: String(this.props.dateIncludeOfIk.slice(-4)) + '0101' + String(this.props.dateIncludeOfIk.slice(-4)) + '1231'
                        }
                    ]
                }
            ]
        };

        const fd = new FormData();
        fd.append("cubeSConst", 'cubeForFundAndIK');
        fd.append("filters", JSON.stringify(filters));
        axios.post(`/${localStorage.getItem('i18nextLng')}/cube/getCubeData`, fd).then(res2 => {
            var cubeData = res2.data.data;
            const parsedCube = parseCube_new(
            cubeData["cube"],
            [],
            "dp",
            "do",
            cubeData['do_' + this.props.tofiConstants.doForFundAndIK.id],
            cubeData['dp_' + this.props.tofiConstants.dpForFundAndIK.id],
            ['do_' + this.props.tofiConstants.doForFundAndIK.id],
            ['dp_' + this.props.tofiConstants.dpForFundAndIK.id]
            );

            var tableData = parsedCube.map(this.renderTableData);

            var oldTableData = JSON.parse(JSON.stringify(tableData[0]['contactPersonsComplex']));
            this.setState({
                cubeData: cubeData,
                oldTableData: oldTableData,
                tableData: tableData[0]['contactPersonsComplex'],
                loading: false
            })
        })
    };
    renderTableData = item => {
        const constArr = ['contactPersonsComplex'];
        const cmplConstArr = ['contactPersonsComplexNum', 'contactPersonsComplexFio', 'contactPersonsComplexPosition', 'contactPersonsComplexPhone', 'contactPersonsComplexEmail'];
        const result = {
            key: item.id
        };
        parseForTable(item.props, this.props.tofiConstants, result, constArr);
        return result;
    };


    deleteRow = (rec) => {
        const showDelete = message.loading('Удаление', 0);

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
                    idDataPropVal: rec.idDataPropVal,
                    val: {
                        kz: String(rec.value),
                        ru: String(rec.value),
                        en: String(rec.value)
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
                showDelete();
                message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED'));
            } else {
                showDelete();
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
                key: [this.props.tofiConstants['contactPersonsComplexNum'].id],
                title: "№",
                dataIndex: [this.props.tofiConstants['contactPersonsComplexNum'].id],
                width: '5%',
                render: (obj, rec, i) => obj[0] && obj[0].valueLng && obj[0].valueLng[this.lng],
                sorter: (a, b) => a[this.props.tofiConstants['contactPersonsComplexNum'].id] && b[this.props.tofiConstants['contactPersonsComplexNum'].id] && parseInt(a[this.props.tofiConstants['contactPersonsComplexNum'].id][0].valueLng.ru) - parseInt(b[this.props.tofiConstants['contactPersonsComplexNum'].id][0].valueLng.ru),
                sortOrder: 'ascend'
            },
            {
                key: [this.props.tofiConstants['contactPersonsComplexFio'].id],
                title: contactPersonsComplexFio.name[this.lng],
                dataIndex: [this.props.tofiConstants['contactPersonsComplexFio'].id],
                width: '24%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        obj[0] && this.state.editable[obj[0].idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">


                            <Row>
                                <Col span={20}>
                                    <Input
                                    value={obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                                    onChange={(e) => this.handleChange(e, obj[0].idDataPropVal, 'contactPersonsComplexFio')}
                                    onPressEnter={() => this.check(obj[0], 'contactPersonsComplexFio')}
                                    />
                                </Col>
                                <Col span={4}
                                     style={{textAlign: 'right', paddingTop: '6px'}}>
                                    <Icon
                                    type="check"
                                    className="editable-cell-icon-check"
                                    onClick={() => this.check(obj[0], 'contactPersonsComplexFio')}
                                    />
                                </Col>
                            </Row>


                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj[0].idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: [this.props.tofiConstants['contactPersonsComplexPosition'].id],
                title: contactPersonsComplexPosition.name[this.lng],
                dataIndex: [this.props.tofiConstants['contactPersonsComplexPosition'].id],
                width: '22%',
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        obj[0] && this.state.editable[obj[0].idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">


                            <Row>
                                <Col span={20}>
                                    <Input
                                    value={obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                                    onChange={(e) => this.handleChange(e, obj[0].idDataPropVal, 'contactPersonsComplexPosition')}
                                    onPressEnter={() => this.check(obj[0], 'contactPersonsComplexPosition')}
                                    />
                                </Col>
                                <Col span={4}
                                     style={{textAlign: 'right', paddingTop: '6px'}}>
                                    <Icon
                                    type="check"
                                    className="editable-cell-icon-check"
                                    onClick={() => this.check(obj[0], 'contactPersonsComplexPosition')}
                                    />
                                </Col>
                            </Row>


                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj[0].idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: [this.props.tofiConstants['contactPersonsComplexPhone'].id],
                title: contactPersonsComplexPhone.name[this.lng],
                dataIndex: [this.props.tofiConstants['contactPersonsComplexPhone'].id],
                render: (obj, rec) => ( <div className="editable-cell">
                    {

                        obj[0] && this.state.editable[obj[0].idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">


                            <Row>
                                <Col span={20}>
                                    <Input
                                    value={obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                                    onChange={(e) => this.handleChange(e, obj[0].idDataPropVal, 'contactPersonsComplexPhone')}
                                    onPressEnter={() => this.check(obj[0], 'contactPersonsComplexPhone')}
                                    />
                                </Col>
                                <Col span={4}
                                     style={{textAlign: 'right', paddingTop: '6px'}}>
                                    <Icon
                                    type="check"
                                    className="editable-cell-icon-check"
                                    onClick={() => this.check(obj[0], 'contactPersonsComplexPhone')}
                                    />
                                </Col>
                            </Row>


                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj[0].idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },
            {
                key: [this.props.tofiConstants['contactPersonsComplexEmail'].id],
                title: contactPersonsComplexEmail.name[this.lng],
                dataIndex: [this.props.tofiConstants['contactPersonsComplexEmail'].id],
                width: '22%',
                render: (obj, rec) => (<div className="editable-cell">
                    {

                        obj[0] && this.state.editable[obj[0].idDataPropVal] ?
                        <div className="editable-cell-input-wrapper">


                            <Row>
                                <Col span={20}>
                                    <Input
                                    value={obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                                    onChange={(e) => this.handleChange(e, obj[0].idDataPropVal, 'contactPersonsComplexEmail')}
                                    onPressEnter={() => this.check(obj[0], 'contactPersonsComplexEmail')}
                                    />
                                </Col>
                                <Col span={4}
                                     style={{textAlign: 'right', paddingTop: '6px'}}>
                                    <Icon
                                    type="check"
                                    className="editable-cell-icon-check"
                                    onClick={() => this.check(obj[0], 'contactPersonsComplexEmail')}
                                    />
                                </Col>
                            </Row>


                        </div>
                        :
                        <div className="editable-cell-text-wrapper">
                            {obj[0] ? obj[0].valueLng ? obj[0].valueLng[this.lng] : '' : ''}
                            <Icon
                            type="edit"
                            className="editable-cell-icon"
                            onClick={() => this.edit(obj[0].idDataPropVal)}
                            />
                        </div>
                    }
                </div>
                )
            },

            {
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
            <Button type="primary" icon="plus-circle-o" loading={this.state.iconLoading}
                    style={{margin: '5px'}}
                    onClick={this.addRow}>
                Добавить контакт
            </Button>
            <AntTable className="fixHeight"
                      loading={this.state.loading}
                      columns={columns}
                      hidePagination
                      dataSource={this.state.tableData}/>
        </div>
        )
    }
}

export default ComplexContactTable2;