import React from "react"
import {connect} from "react-redux";
import {
    CUBE_FOR_AF_INV,
    CUBE_FOR_FUND_AND_IK,
    CUBE_FOR_ORG_FUNDMAKER,
    DO_FOR_FUND_AND_IK, DO_FOR_INV,
    DP_FOR_FUND_AND_IK, DP_FOR_INV,
    DT_FOR_FUND_AND_IK, FORM_OF_ADMISSION, FUND_MAKER_ARCHIVE, LEGAL_STATUS
} from '../../constants/tofiConstants';
import Select from '../Select';

import {getCube, getPropVal, getIdGetObj, getObjByObjVal, createObj, dObj} from '../../actions/actions';
import {CSSTransition} from "react-transition-group";
import SiderCard from "../SiderCard";

import AntTable from "../AntTable";
import {Spin, Icon, Input, Checkbox,Popconfirm, Button, message, DatePicker} from 'antd';
import moment from "moment";
import axios from "axios"
import {parseCube_new, onSaveCubeData, parseForTable} from "../../utils/cubeParser";
import {isEmpty, isEqual} from "lodash";
import Card from "./CardInvIk"


class TablelegalEntities extends React.Component {

    state = {
        loading: false,
        openCard: false,
        dateReport: moment().format("DD-MM-YYYY"),
        selectedRow: null,
        data: [],
        numberFull: [],

        dataInv:[],
        ikNameOptopns: [],
        filter: {
            name: '',
            sourceOrgList: '',
            ikType: '',
            ikName: [],
            dateIncludeOfIk: moment().format("DD-MM-YYYY"),
            legalStatus: [],
            legalStatusLoading: false,
            fundmakerArchive: [],
            fundmakerArchiveLoading: false,
            formOfAdmission: [],
            formOfAdmissionLoading: false,
            orgIndustry: [],
            orgIndustryChildren: [],
            orgIndustryLoading: false
        },

    }


    renderTableData = (item, idx) => {

        const constArr = ["numberOfIK", "orgDocType", "legalStatus", "formOfAdmission", "fundArchive", "dateIncludeOfIk", "dateExcludeOfIk", "fundmakerOfIK"];
        const result = {
            idss: idx + 1,
            clsORtr: item.clsORtr,
            id: item.id,
            name: item.name,

        };
        parseForTable(item.props, this.props.tofiConstants, result, constArr)
        return result;
    };
    onCreateObj = ({name, accessLevel, ...values}) => {

        const cube = {
            cubeSConst: CUBE_FOR_AF_INV
        };

        const obj = {
            name: name,
            fullName: name,
            clsConst: 'invList',
            accessLevel
        };

        const hideCreateObj = message.loading(this.props.t('CREATING_NEW_OBJECT'), 0);
        return createObj(cube, obj)
            .then(res => {
                hideCreateObj();
                if (res.success) {
                    return this.onSaveCubeData(values, res.data.idItemDO, {})
                } else {
                    if (res.errors) {
                        res.errors.forEach(err => {
                            message.error(err.text)
                        })
                    }
                }
            }).catch(err => {
                console.error(err)
            })
    };

    onSaveCubeData = async ({approvalProtocol, invFile, agreement2Protocol, agreementProtocol, ...values}, doItemProp, objDataProp) => {
        let hideLoading
        const filters = {
            filterDOAnd: [
                {
                    dimConst: DO_FOR_INV,
                    concatType: "and",
                    conds: [
                        {
                            data: {
                                valueRef: {
                                    id: this.props.match.params.idFundCard
                                }
                            }
                        }
                    ]
                }
            ]
        }
        try {
            const c = {
                cube: {
                    cubeSConst: CUBE_FOR_AF_INV,
                    doConst: DO_FOR_INV,
                    dpConst: DP_FOR_INV,
                    data: this.props.CubeForAF_Inv
                },
                obj: {
                    doItem: doItemProp
                }
            }

            const v = {
                values: values,
                complex: "",
                oFiles: {
                    agreementProtocol: agreementProtocol,
                    approvalProtocol: approvalProtocol,
                    invFile: invFile,
                    agreement2Protocol: agreement2Protocol
                }
            }
            const objData = objDataProp
            const t = this.props.tofiConstants
            this.setState({loading: true,});

            hideLoading = message.loading(this.props.t('UPDATING_PROPS'), 0);
            const resSave = await onSaveCubeData(c, v, t, objData);
            hideLoading();
            if (!resSave.success) {
                message.error(this.props.t('PROPS_UPDATING_ERROR'));
                resSave.errors.forEach(err => {
                    message.error(err.text)
                });
                return Promise.reject(resSave);
            }
            message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED'));
            return this.props.getCube('CubeForAF_Inv', JSON.stringify(filters), {customKey: 'InvItem'}).then(() => this.setState({loading: false}))
                .catch(err => {
                    console.error(err);
                    this.setState({loading: false})
                })


        } catch (e) {
            typeof hideLoading === 'function' && hideLoading();
            this.setState({loading: false});
            console.warn(e);
        }
    }

    async componentDidMount() {
        this.setState({
            loading: this
        })
        const filters = {
            filterDPAnd: [
                {
                    dimConst: 'dpForFundAndIK',
                    concatType: "and",
                    conds: [
                        {
                            consts:
                                "numberOfIK,orgDocType,legalStatus,formOfAdmission,fundArchive,dateIncludeOfIk,dateExcludeOfIk,fundmakerOfIK"
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
                            clss: "sourceOrgList,sourceLPList"
                        }
                    ]
                }
            ]
        };
        await  this.props.getCube('cubeForFundAndIK', JSON.stringify(filters), {customKey: 'orgSourceCube'}).then(() => this.setState({loading: false}))
            .catch(err => {
                console.error(err);
            })

        const parsedCube = parseCube_new(this.props.orgSourceCube['cube'],
            [],
            'dp',
            'do',
            this.props.orgSourceCube['do_' + this.props.tofiConstants['doForFundAndIK'].id],
            this.props.orgSourceCube['dp_' + this.props.tofiConstants['dpForFundAndIK'].id],
            'do_' + this.props.tofiConstants['doForFundAndIK'].id,
            'dp_' + this.props.tofiConstants['dpForFundAndIK'].id
        ).map(this.renderTableData);
        this.setState({
            data: parsedCube,
        })
    }

    componentWillReceiveProps(nextProps) {

        // Typical usage (don't forget to compare props):
        if (nextProps.InvItem !== this.props.InvItem)  {
            const {doForInv, dpForInv} =nextProps.tofiConstants;
            let parserCube = parseCube_new(nextProps.InvItem['cube'], [], 'dp', 'do', nextProps.InvItem [`do_${doForInv.id}`], nextProps.InvItem [`dp_${dpForInv.id}`], `do_${doForInv.id}`, `dp_${dpForInv.id}`).map(this.renderTableDataInv);
           this.setState({
               dataInv:parserCube
           },() => {
               this.state.dataInv.map((el) => {
                   let fdGetCountFund = new FormData();
                   fdGetCountFund.append('idInv', el.id.split('_')[1]);
                   axios.post(`/${localStorage.getItem('i18nextLng')}/archiveFund/countCasesOfInv`, fdGetCountFund).then(res => {
                       if (res.data.success === true) {
                           this.setState({
                               numberFull: this.state.numberFull.concat({
                                   key: el.id.split('_')[1],
                                   value: res.data.data.countCasesOfInv
                               })
                           })
                       }
                   })
               })

           })
        }
    }
    renderTableDataInv=(item)=>{
        const constArr = ['invNumber', 'invDates', 'invType', 'invStorage', 'fundNumberOfCases', "caseStorageMulti", "rackMulti", "sectionMulti", "shelfMulti", 'fundNumberOfCasesWithFiles',
            'documentType', 'fundFeature', 'invCaseSystem', 'invApprovalDate2', 'invApprovalDate1', 'invAgreement2Date',
            'invAgreementDate', 'agreementProtocol', 'agreement2Protocol', 'approvalProtocol',"invFile", 'invCont'];

        const accessLevelObj = this.props.accessLevelOptions.find(al => al.id === item.accessLevel);


        const result = {
            key: item.id,
            name: item.name,
            accessLevel: accessLevelObj && {value: accessLevelObj.id, label: accessLevelObj.name[this.lng]},
        };
        parseForTable(item.props, this.props.tofiConstants, result, constArr);
        result.invDates = result.invDates ? result.invDates.map(str => ({value: str})) : [];
        return result;
    }
    changeSelectedRow = rec => {
        if (isEmpty(this.state.selectedRow) || !isEqual(this.state.selectedRow, rec)) {
            this.setState({selectedRow: rec})
        } else {
            this.setState({openCard: true})
        }
    };

    loadOptions = (c, withChilds) => {
        return () => {
            if (!this.props[c + 'Options']) {
                this.setState({filter: {...this.state.filter, [c + 'Loading']: true}});
                !withChilds && this.props.getPropVal(c)
                    .then(() => this.setState({
                        filter: {
                            ...this.state.filter,
                            [c + 'Loading']: false
                        }
                    }))
                    .catch(() => message.error('Ошибка загрузки данных'));
                withChilds && this.props.getPropValWithChilds(c)
                    .then(() => this.setState({
                        filter: {
                            ...this.state.filter,
                            [c + 'Loading']: false
                        }
                    }))
                    .catch(() => message.error('Ошибка загрузки данных'));

            }
        }
    };
    onLegalStatusChange = s => {
        this.setState({filter: {...this.state.filter, legalStatus: s}})
    };
    onOrgLocationChange = s => {
        if (!Array.isArray(s)) {
            this.setState({filter: {...this.state.filter, fundmakerArchive: [s]}})

        } else {
            this.setState({filter: {...this.state.filter, fundmakerArchive: s}})

        }

    };
    onFundTypeChange = s => {
        if (s === null) {
            this.setState({filter: {...this.state.filter, ikType: ""}});
        } else {
            this.setState({filter: {...this.state.filter, ikType: s}});

        }
    };
    ikNameChange = s => {
        this.setState({filter: {...this.state.filter, ikName: s}}, () => {
            this.getCubeInv(this.state.filter.ikName)
        });

    };
    getCubeInv = (ikObj) => {
        this.setState({
            loading: this
        })
        const fd = new FormData();
        fd.append("idIK", ikObj.value.split('_')[1]);
        axios.post(`/${localStorage.getItem('i18nextLng')}/entity/getIdFundByIdIK`, fd)
            .then(res => {
                getIdGetObj(res.data.data.idFund, DO_FOR_FUND_AND_IK).then(resId => {
                    const filters = {
                        filterDOAnd: [
                            {
                                dimConst: DO_FOR_INV,
                                concatType: "and",
                                conds: [
                                    {
                                        data: {
                                            valueRef: {
                                                id: String( resId.data.idDimObj)
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                    this.props.getCube('CubeForAF_Inv', JSON.stringify(filters), {customKey: 'InvItem'}).then(() => this.setState({loading: false}))
                        .catch(err => {
                            console.error(err);
                            this.setState({loading: false})
                        })

                }).catch(e=>{
                    console.log(e)

                })


                })
            .catch(err => {
                console.log(err)
            })

    };

    onFormOfAdmissionChange = s => {
        this.setState({filter: {...this.state.filter, formOfAdmission: s}})
    };
    onFormOfAdateIncludeOfIkChange = (s, data) => {
        if (s === null) {
            return false
        }
        this.setState({
            dateReport: moment(data).format("DD-MM-YYYY")
        })
        this.setState({filter: {...this.state.filter, dateIncludeOfIk: moment(data).format("DD-MM-YYYY")}})
    };
    dateReport = (mom, data) => {
        if (mom === null) {
            return false
        }
        this.setState({
            dateReport: data
        })

    }
    showAllRender = (val) => {
        if (val.target.checked === false) {
            this.setState({
                filter: {
                    ...this.state.filter,
                    dateIncludeOfIk: moment(this.state.dateReport).format("DD-MM-YYYY")
                }
            })
        } else {
            this.setState({
                filter: {
                    ...this.state.filter,
                    dateIncludeOfIk: ""
                }
            })
        }
    }


    onInputChange = e => {
        this.setState({
            filter: {
                ...this.state.filter,
                [e.target.name]: e.target.value
            }
        })
    };
    filterDate = (filter, startDate, endDate) => {

        if (filter === "") {
            return true
        }
        if (!!startDate || !!endDate) {
            let data = moment(startDate.value, "DD-MM-YYYY").isBefore(moment(filter, "DD-MM-YYYY"))
            let data2
            if (!!endDate) {
                data2 = moment(endDate.value, "DD-MM-YYYY").isAfter(moment(filter, "DD-MM-YYYY"))

            } else {
                data2 = true
            }
            if (data === true && data2 === true) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    }
    renderTableFooter = () => {
        const {t} = this.props;
        return (
            <div className="table-footer">
                <div className="flex">
                    <div className="data-length">
                        <div className="label">
                            <label htmlFor="">Всего</label>
                            <Input
                                size="small"
                                type="text"
                                readOnly
                                value={this.filteredData.length + " / " + this.state.data.length}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    render() {
        const {t, tofiConstants, legalStatusOptions, fundmakerArchiveOptions, orgIndustryOptions, formOfAdmissionOptions} = this.props;
        const {legalStatus, fundmakerArchive, orgIndustry, formOfAdmission, invNumber, invDates, invList, invType, documentType, fundNumberOfCases, fundNumberOfCasesWithFiles} = tofiConstants;
        const lng = localStorage.getItem('i18nextLng');

        const {loading, openCard, filter} = this.state;

        this.lng = localStorage.getItem("i18nextLng");
        this.filteredData = this.state.data.filter(item => {

            return (
                ( this.filterDate(filter.dateIncludeOfIk, item.dateIncludeOfIk, item.dateExcludeOfIk)) &&
                (item.name && String(item.name[localStorage.getItem('i18nextLng')]).toLowerCase().includes(String(filter.name).toLowerCase())) &&
                ( filter.orgIndustry.length === 0 || filter.orgIndustry.some(p => item.fundArchive.some(v => v.value === p.value))) &&
                ( filter.fundmakerArchive.length === 0 || filter.fundmakerArchive.some(p => (item.fundArchive && p.value == item.fundArchive.value))) &&
                ( filter.ikType === "" || String(filter.ikType.value) === String(item.clsORtr) ) &&
                ( filter.legalStatus.length === 0 || filter.legalStatus.some(p => (item.legalStatus && p.value == item.legalStatus.value))) &&
                ( filter.formOfAdmission.length === 0 || filter.formOfAdmission.some(p => (item.formOfAdmission && p.value == item.formOfAdmission.value)))
            )
        });
        return (
            <div className='Works'>

                <div className="Works__heading ">
                    <div className="table-header ">

                        <div className="label-select">
                            <Button
                            onClick={() => {
                            const accessLevelObj = this.props.accessLevelOptions.find(al => al.id === 1);
                            this.setState({
                                openCard: true,
                                selectedRow: {
                                    fundId: this.props.match.params.idFundCard,
                                    accessLevel: {value: accessLevelObj.id, label: accessLevelObj.name[this.lng]},
                                    fundFeature: {
                                        value: this.props.tofiConstants.included.id,
                                        label: this.props.tofiConstants.included.name[this.lng]
                                    },
                                    invType: {
                                        value: this.props.tofiConstants.invOCD.id,
                                        label: this.props.tofiConstants.invOCD.name[this.lng]
                                    }
                                }
                            })
                        }}>{t('ADD')}</Button>
                        </div>


                        <div className="label-select">
                            <Select
                                name="fundmakerArchive"
                                isMulti
                                isSearchable
                                optionHeight={40}
                                isLoading={filter.fundmakerArchiveLoading}
                                onMenuOpen={this.loadOptions(FUND_MAKER_ARCHIVE)}
                                value={filter.fundmakerArchive}
                                onChange={this.onOrgLocationChange}
                                options={fundmakerArchiveOptions ? fundmakerArchiveOptions.map(option => ({
                                    value: option.id,
                                    label: option.name[this.lng]
                                })) : []}
                                placeholder={fundmakerArchive.name[this.lng]}
                            /></div>
                        <div className="label-select">
                            <Select
                                name="ikType"
                                isSearchable={false}
                                value={filter.ikType}
                                disabled={filter.fundmakerArchive.length > 0 ? false : true}
                                onChange={this.onFundTypeChange}
                                options={[
                                    "sourceOrgList",
                                    "sourceLPList"
                                ].map(c => ({
                                    value: this.props.tofiConstants[c].id,
                                    label: this.props.tofiConstants[c].name[this.lng]
                                }))}
                                placeholder="Тип источника комплектования"
                            />
                        </div>
                        <div className="label-select">
                            <Select
                                name="legalStatus"
                                isMulti
                                isSearchable={false}
                                disabled={Object.keys(filter.ikType).length > 0 ? false : true}
                                value={filter.legalStatus}
                                onChange={this.onLegalStatusChange}
                                isLoading={filter.legalStatusLoading}
                                options={legalStatusOptions ? legalStatusOptions.map(option => ({
                                    value: option.id,
                                    label: option.name[this.lng]
                                })) : []}
                                placeholder={legalStatus.name[this.lng]}
                                onMenuOpen={this.loadOptions(LEGAL_STATUS)}
                            />
                        </div>
                        <div className="label-select">
                            <Select
                                name="formOfAdmission"
                                isMulti
                                isSearchable={false}
                                disabled={filter.legalStatus.length > 0 ? false : true}
                                value={filter.formOfAdmission}
                                onChange={this.onFormOfAdmissionChange}
                                onMenuOpen={this.loadOptions(FORM_OF_ADMISSION)}
                                isLoading={filter.formOfAdmissionLoading}
                                options={formOfAdmissionOptions ? formOfAdmissionOptions.map(option => ({
                                    value: option.id,
                                    label: option.name[this.lng]
                                })) : []}
                                placeholder={formOfAdmission.name[this.lng]}
                            />
                        </div>
                        <div className="label-select" style={{width: "1px"}}>

                            <DatePicker
                                name="periodType"
                                onChange={this.onFormOfAdateIncludeOfIkChange}

                                value={moment(this.state.dateReport, "DD-MM-YYYY")}
                            />

                        </div>
                        <div className="label-select" style={{width: "1px"}}>
                            <Checkbox
                                onChange={this.showAllRender}>Показать все</Checkbox>
                        </div>
                        <div className="label-select">
                            <Select
                                name="ikName"
                                isSearchable={true}
                                disabled={filter.fundmakerArchive.length > 0 && Object.keys(filter.ikType).length > 0 ? false : true}
                                value={filter.ikName}
                                onChange={this.ikNameChange}
                                options={this.filteredData ? this.filteredData.map(option => ({
                                    value: option.id,
                                    label: option.name[this.lng]
                                })) : []}
                                placeholder={"Источник комплектования"}
                            />


                        </div>
                    </div>
                </div>
                <div className='LegalEntities__body'>

                    <AntTable
                        columns={
                            [
                                {
                                    key: 'invNumber',
                                    title: t('INV_NUMB'),
                                    dataIndex: 'invNumber',
                                    width: '7%',
                                    render:obj=>obj && obj.value,

                                },
                                {
                                    key: 'name',
                                    title: invList.name[lng],
                                    dataIndex: 'name',
                                    width: '25%',

                                    render: obj => obj && obj[this.lng]
                                },
                                {
                                    key: 'invDates',
                                    title: invDates.name[lng],
                                    dataIndex: 'invDates',
                                    width: '10%',


                                    render: arr => arr && arr.map(o => o.value.value).join(', ')
                                },
                                {
                                    key: 'invType',
                                    title: invType.name[lng],
                                    dataIndex: 'invType',
                                    width: '10%',
                                    render: obj => obj && obj.label
                                },
                                {
                                    key: 'documentType',
                                    title: documentType.name[lng],
                                    dataIndex: 'documentType',
                                    width: '10%',
                                    render: obj => obj && obj.label
                                },
                                {
                                    key: 'fundNumberOfCases',
                                    title: fundNumberOfCases.name[lng],
                                    dataIndex: 'fundNumberOfCases',
                                    width: '15%',
                                    render: (text, record) => {
                                        let rezul = this.state.numberFull.find((el) => record.key.split('_')[1] === el.key)
                                        if (rezul === undefined)return false
                                        return rezul.value
                                    }
                                },
                                {
                                    key: 'fundNumberOfCasesWithFiles',
                                    title: fundNumberOfCasesWithFiles.name[lng],
                                    dataIndex: 'fundNumberOfCasesWithFiles',
                                    width: '15%'
                                },
                                {
                                    key: 'action',
                                    title: '',
                                    dataIndex: '',
                                    width: '8%',
                                    render: (text, record) => {
                                        return (
                                            <div className="editable-row-operations" style={{display: 'flex'}}>
                                                <Button icon="edit" className="green-btn" style={{marginRight: '5px'}}
                                                        disabled={this.state.selectedRow && this.state.selectedRow.key !== record.key}/>
                                                <Popconfirm title={this.props.t('CONFIRM_REMOVE')} onConfirm={() => {
                                                    const fd = new FormData();
                                                    fd.append("cubeSConst", CUBE_FOR_AF_INV);
                                                    fd.append("dimObjConst", DO_FOR_INV);
                                                    fd.append("objId", record.key.split('_')[1]);
                                                    const hideLoading = message.loading(this.props.t('REMOVING'), 30);
                                                    dObj(fd)
                                                        .then(res => {
                                                            hideLoading();
                                                            if (res.success) {
                                                                message.success(this.props.t('SUCCESSFULLY_REMOVED'));
                                                                this.setState({loading: true});
                                                                this.remove(record.key)
                                                            } else {
                                                                throw res
                                                            }
                                                        })
                                                        .then(() => this.setState({loading: false, openCard: false}))
                                                        .catch(err => {
                                                            console.log(err);
                                                            message.error(this.props.t('REMOVING_ERROR'))
                                                        })
                                                }}>
                                                    <Button title="Удалить" icon="delete"
                                                            onClick={e => e.stopPropagation()}
                                                            className="green-btn yellow-bg"
                                                            disabled={this.state.selectedRow  && this.state.selectedRow.key !== record.key}/>
                                                </Popconfirm>
                                            </div>
                                        );
                                    },
                                }
                            ]
                        }
                        dataSource={this.state.dataInv}
                        bordered
                        footer={this.renderTableFooter}
                        loading={this.state.loading}
                        changeSelectedRow={this.changeSelectedRow}
                        rowClassName={record => {
                            return !!this.state.selectedRow && this.state.selectedRow.id === record.id ? 'row-selected' : ''
                        }}


                    />

                    <CSSTransition
                        in={this.state.openCard}
                        timeout={300}
                        classNames="card"
                        unmountOnExit
                    >
                        <SiderCard className="minW900px"
                                   closer={
                                       <Button
                                           type="danger"
                                           onClick={() => this.setState({openCard: false})}
                                           shape="circle"
                                           style={{left: 0, top: 20}}
                                           icon="arrow-right"
                                       />
                                   }
                        >
                            <Card className="minW900px"
                                  t={t}
                                  tofiConstants={this.props.tofiConstants}
                                  initialValues={this.state.selectedRow}
                                  onCreateObj={this.onCreateObj}
                                  onSaveCubeData={this.onSaveCubeData}
                            />
                        </SiderCard>
                    </CSSTransition>


                </div>


            </div>
        );
    }

}


function

mapStateToProps(state) {
    return {
        tofiConstants: state.generalData.tofiConstants,
        orgSourceCube: state.cubes.orgSourceCube,
        fundmakerArchiveOptions: state.generalData[FUND_MAKER_ARCHIVE],
        legalStatusOptions: state.generalData[LEGAL_STATUS],
        InvItem: state.cubes.InvItem,
        accessLevelOptions: state.generalData.accessLevel,

        formOfAdmissionOptions: state.generalData[FORM_OF_ADMISSION],
        orgSourceCubeSingle: state.cubes.orgSourceCubeSingle,
        indSourceCubeSingle: state.cubes.indSourceCubeSingle,
        IK_FUNDMAKER_ACTIVE: state.generalData.IK_FUNDMAKER_ACTIVE
    }
}

export default connect(mapStateToProps, {getCube, getPropVal, getObjByObjVal})

(
    TablelegalEntities
)
;