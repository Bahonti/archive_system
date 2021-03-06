import React, {Component} from 'react';
import {Button, Form} from 'antd';
import {Field, formValueSelector, reduxForm} from 'redux-form';
import {
    renderDatePicker, renderFileUploadBtn, renderInput, renderInputLang, renderSelect, renderTextareaLang
} from '../../../utils/form_components';
import {isEmpty, isEqual, pickBy} from 'lodash';
import {
    getAccessLevels,
    getPropVal,
    getObjChildsByConst,
    getPropValWithChilds,
    getCube, saveValueOfMultiText
} from '../../../actions/actions';
import {
    CUBE_FOR_ORG_FUNDMAKER,
    DO_FOR_ORG_FUNDMAKER,
    DP_FOR_ORG_FUNDMAKER,
    FORM_OF_ADMISSION,
    FUND_MAKER_ARCHIVE,
    IS_ACTIVE,
    LEGAL_STATUS,
    ORG_DOC_TYPE,
    ORG_INDUSTRY
} from '../../../constants/tofiConstants';
import {connect} from 'react-redux';
import {requiredArr, requiredLabel, requiredLng} from "../../../utils/form_validations";
import {message} from "antd/lib/index";
import {getParents} from "../../../utils";
import {parseCube_new, parseForTable} from '../../../utils/cubeParser';
import moment from 'moment/moment';
import Row from "antd/es/grid/row";
import Col from "antd/es/grid/col";

class MainInfoFundMaker extends Component {

    constructor(props) {
        super(props);
        const lng = localStorage.getItem('i18nextLng');
        this.state = {
            lang: {
                orgFunctionFundmaker: localStorage.getItem("i18nextLng"),
                structureFundmaker: localStorage.getItem("i18nextLng"),
                shortName: lng,
                name: lng,
                orgAddress: lng,
                orgFormationDoc: lng,
                orgReorganizationDoc: lng,
                departmentalAccessory: lng,
            },
            loading: {
                legalStatusLoading: false,
                formOfAdmissionLoading: false,
                orgIndustryLoading: false,
                isActiveLoading: false,
                fundmakerArchiveLoading: false,
                orgDocTypeLoading: false,
                objSubordinationLoading: false
            },
            optionMultiSelect: []
        };
    }

    disabledStartDate = (startValue) => {
        const endValue = this.props.dendValue;
        if (!startValue || !endValue) {
            return false;
        }
        return startValue.valueOf() > endValue.valueOf();
    };

    loadOptions = (c, withChilds) => {
        return () => {
            if (!this.props[c + 'Options']) {
                this.setState({loading: {...this.state.loading, [c + 'Loading']: true}});
                !withChilds && this.props.getPropVal(c)
                    .then(() => this.setState({
                        loading: {
                            ...this.state.loading,
                            [c + 'Loading']: false
                        }
                    }))
                    .catch(() => message.error('Ошибка загрузки данных'));
                withChilds && this.props.getPropValWithChilds(c)
                    .then(() => this.setState({
                        loading: {
                            ...this.state.loading,
                            [c + 'Loading']: false
                        }
                    }))
                    .catch(() => message.error('Ошибка загрузки данных'));

            }
        }
    };


    strToRedux = (val, prevVal, obj, prevObj, flag) => {
        if (!!flag) {
            val = val.replace(/[^\d;]/g, '')
        }
        var newVal = {...prevVal};
        if (prevVal === null) {
            let objVal = {
                value: val,
                valueLng: {kz: val},
                valueLng: {ru: val},
                valueLng: {en: val}
            };
            return objVal
        } else {
            newVal.value = val;
            newVal['valueLng'] = {kz: val, ru: val, en: val}
            return (newVal)

        }
    };

    fileToRedux = (val, prevVal, file, str) => {
        let newFile = val.filter(el => el instanceof File);
        if (newFile.length > 0) {
            var copyVal = prevVal ? [...prevVal] : []
            newFile.map(el => {
                copyVal.push({
                    value: el
                })
            });
            return copyVal
        } else {
            return val.length == 0 ? [] : val
        }
    };

    selectToRedux = (val, prevVal, obj, prevObj) => {
        if (val !== undefined) {
            if (val === null) {
                let newValNull = {...prevVal};
                newValNull.label = null;
                newValNull.labelFull = null;
                newValNull.value = null;
                return newValNull
            } else {
                let newVal = {...prevVal};
                newVal.value = val.value;
                newVal.label = val.label;
                newVal.labelFull = val.label;
                return (newVal)
            }

        }
    };

    selectMultiToRedux = (val, prevVal, obj, prevObj) => {
        if (val !== undefined) {
            if (val.length > 0) {
                let coppyPrevVal = prevVal ? [...prevVal] : []
                let coppyVal = [...val]
                if (coppyPrevVal.length > 0) {
                    for (let i = 0; i < coppyPrevVal.length; i++) {
                        if (coppyPrevVal[i].idDataPropVal == undefined) continue
                        if (coppyPrevVal[i].idDataPropVal !== undefined) {
                            let findePrevVal = this.state.optionMultiSelect.find((el) => el.idDataPropVal === coppyPrevVal[i].idDataPropVal)

                            if (findePrevVal === undefined) {
                                setTimeout(() => {
                                    this.setState({
                                        optionMultiSelect: this.state.optionMultiSelect.concat(coppyPrevVal[i])
                                    })
                                })

                            }
                        }

                    }
                }

                for (let i = 0; i < coppyVal.length; i++) {
                    if (coppyVal[i].idDataPropVal === undefined) {
                        let findVal = this.state.optionMultiSelect.find((el) => el.value === coppyVal[i].value)
                        if (findVal !== undefined) {
                            coppyVal.splice(i, 1)
                            coppyVal.push(findVal)
                        }
                    }
                }
                return coppyVal
            } else {
                return []
            }
        }
    };

    dateToRedux = (val, prev) => {
        {
            let coppyPrev = {...prev}

            if (!!val) {
                let newDate = moment(val).format("DD-MM-YYYY")
                if (!!coppyPrev.idDataPropVal) {
                    coppyPrev.value = newDate
                    return coppyPrev
                } else {
                    return {
                        value: newDate
                    }
                }
            } else {
                if (!!coppyPrev.value) {
                    coppyPrev.value = ""
                    return coppyPrev
                } else {
                    return {}
                }

            }

        }
    }

    /*strToRedux = (val, prevVal, obj, prevObj) => {
        var newVal = {...prevVal};
        if (prevVal === null) {
            let objVal = {
                value: val,
                valueLng: {kz: val},
                valueLng: {ru: val},
                valueLng: {en: val}
            }
            return objVal
        } else {
            newVal.value = val;
            newVal['valueLng']={kz:val,ru:val,en:val}

            return (newVal)

        }
    };*/

    loadChilds = c => {
        return () => {
            if (!this.props[c + 'Options']) {
                this.setState({loading: {...this.state.loading, [c + 'Loading']: true}});
                this.props.getObjChildsByConst(c)
                    .then(() => this.setState({
                        loading: {
                            ...this.state.loading,
                            [c + 'Loading']: false
                        }
                    }))
                    .catch(err => console.error(err))
            }
        }
    };

    componentDidMount() {
        if (!this.props.accessLevelOptions) {
            this.props.getAccessLevels();
        }
        if (!this.props.orgIndustryOptions) {
            this.props.getPropValWithChilds('orgIndustry')
        }

    }

    changeLang = e => {
        this.setState({lang: {...this.state.lang, [e.target.name]: e.target.value}});
    };

    shortNameValue = {...this.props.initialValues.shortName} || {kz: '', ru: '', en: ''};
    nameValue = {...this.props.initialValues.name} || {kz: '', ru: '', en: ''};
    orgAddressValue = {...this.props.initialValues.orgAddress} || {
        kz: '',
        ru: '',
        en: ''
    };
    orgFormationDocValue = this.props.orgFormationDoc && this.props.orgFormationDoc.valueLng || {
        kz: '',
        ru: '',
        en: ''
    };
    orgReorganizationDocValue = {...this.props.initialValues.orgReorganizationDoc} || {
        kz: '',
        ru: '',
        en: ''
    };
    departmentalAccessoryValue = {...this.props.initialValues.departmentalAccessory} || {
        kz: '',
        ru: '',
        en: ''
    };
    componentDidUpdate(prevProps) {
        if (prevProps.initialValues !== this.props.initialValues) {
            this.shortNameValue = {...this.props.initialValues.shortName} || {
                kz: '',
                ru: '',
                en: ''
            };
            this.nameValue = {...this.props.initialValues.name} || {
                kz: '',
                ru: '',
                en: ''
            };
            this.orgAddressValue = {...this.props.initialValues.orgAddress} || {
                kz: '',
                ru: '',
                en: ''
            };
            this.orgFormationDocValue = {...this.props.initialValues.orgFormationDoc} || {
                kz: '',
                ru: '',
                en: ''
            };
            this.orgReorganizationDocValue = {...this.props.initialValues.orgReorganizationDoc} || {
                kz: '',
                ru: '',
                en: ''
            };
            this.departmentalAccessoryValue = {...this.props.initialValues.departmentalAccessory} || {
                kz: '',
                ru: '',
                en: ''
            };
        }
    }

    onSubmit = async(values) => {

        const {doForFundAndIK, dpForFundAndIK} = this.props.tofiConstants;
        const {shortName, name, dbeg, dend, orgFunctionFundmaker, structureFundmaker, accessLevel, orgFunction, structure, reasonFundmakerFile, ...rest} = pickBy(values, (val, key) => !isEqual(val, this.props.initialValues[key]));
        const cube = {
            cubeSConst: 'cubeForOrgFundmaker',
            doConst: 'doForOrgFundmakers',
            dpConst: 'dpForOrgFundmakers',
        };
        const obj = {
            name: shortName,
            fullName: name,
            clsConst: 'fundmakerOrg',
            dbeg,
            dend,
            accessLevel: String(values.accessLevel.value)
        };
        //if(rest.orgIndustry) rest.orgIndustry = getParents(this.props.orgIndustryOptions, rest.orgIndustry);
        if (!this.props.initialValues.key) {

            return this.props.onCreateObj(
                {cube, obj},
                {values: rest, idDPV: this.props.withIdDPV, oFiles: {orgFunction, structure, reasonFundmakerFile}},
                structureFundmaker, orgFunctionFundmaker
            )
        }
        obj.doItem = this.props.initialValues.key;
        const objData = {};
        if (shortName) objData.name = shortName;
        if (name) objData.fullName = name;
        if (dbeg) objData.dbeg = dbeg;
        if (dend) objData.dend = dend;
        if (accessLevel) objData.accessLevel = accessLevel;
        // Сохраняем значения свойств fundNumber, fundmakerArchive (fundArchive для ИК), formOfAdmission, legalStatus, isActive для соответстующего источника комплектования, если хотя бы одно изменилось.
        if (shortName || name || dbeg || dend || accessLevel || rest.fundNumber || rest.fundmakerArchive || rest.formOfAdmission || rest.legalStatus || rest.isActive || rest.orgIndustry) {
            const filters = {
                filterDOAnd: [
                    {
                        dimConst: 'doForFundAndIK',
                        concatType: "and",
                        conds: [
                            {
                                data: {
                                    dimPropConst: 'dpForFundAndIK',
                                    propConst: 'fundmakerOfIK',
                                    valueRef: {id: `wa_${obj.doItem.split('_')[1]}`}
                                }
                            }
                        ]
                    }
                ],

                filterDPAnd: [
                    {
                        dimConst: 'dpForFundAndIK',
                        concatType: "and",
                        conds: [
                            {
                                consts: 'orgIndustry,legalStatus'
                            }
                        ]
                    }
                ]
            };
           await this.props.getCube('cubeForFundAndIK', JSON.stringify(filters), {customKey: 'cubeForFundAndIKSingle'})
                .then(() => {
                    const parsedCube = parseCube_new(
                        this.props.cubeForFundAndIKSingle['cube'],
                        [],
                        'dp',
                        'do',
                        this.props.cubeForFundAndIKSingle[`do_${doForFundAndIK.id}`],
                        this.props.cubeForFundAndIKSingle[`dp_${dpForFundAndIK.id}`],
                        `do_${doForFundAndIK.id}`,
                        `dp_${dpForFundAndIK.id}`).map(this.renderTableDataIk)[0];

                    const cIK = {
                        cube: {
                            cubeSConst: 'cubeForFundAndIK',
                            doConst: 'doForFundAndIK',
                            dpConst: 'dpForFundAndIK',
                            data: this.props.cubeForFundAndIKSingle
                        },
                        obj: {doItem: parsedCube.key}
                    };
                    const { legalStatus, orgIndustry} = rest;
                    let legalStatus2
                    if (!!parsedCube.legalStatus){
                        legalStatus2= legalStatus
                        legalStatus2.idDataPropVal=parsedCube.legalStatus.idDataPropVal
                    }else {
                        if (!!legalStatus.idDataPropVal){
                            legalStatus2= legalStatus
                            legalStatus2.idDataPropVal=""
                        }else {
                            legalStatus2= legalStatus
                        }
                    }
                    const vIK = {
                        values: JSON.parse(JSON.stringify({
                            legalStatus:legalStatus2,
                            orgIndustry,
                        })),
                    };
                    //console.log('vIK ', vIK);
                    this.props.saveIKProps(cIK, vIK, this.props.tofiConstants, objData);
                });
        }
        if (!!orgFunctionFundmaker) {
            this.saveMultiText(orgFunctionFundmaker, 'orgFunctionFundmaker')
        }
        if (!!structureFundmaker) {
            this.saveMultiText(structureFundmaker, 'structureFundmaker')
        }
        return this.props.saveProps(
            {cube, obj},
            {values: rest, idDPV: this.props.withIdDPV, oFiles: {orgFunction, structure, reasonFundmakerFile}},
            this.props.tofiConstants,
            objData
        );
    };
    renderTableDataIk = (item, ids) => {
        const constArr = ['orgIndustry', 'legalStatus'];
        const result = {
            key: item.id,
            ids: ids + 1,
            name: item.name,
            fullName: item.fullName

        };
        parseForTable(item.props, this.props.tofiConstants, result, constArr);
        return result;
    }

    saveMultiText = (value, key) => {
        const dataToSend = [];
        var mod = 'ins';
        if (!!value.idDataPropVal) {
            mod = 'upd'
        }
        ;
        dataToSend.push(
            {
                propConst: key,
                vals: [
                    {
                        idDataPropVal: value.idDataPropVal,
                        mode: mod,
                        val: {
                            kz: value.valueLng.kz,
                            ru: value.valueLng.ru,
                            en: value.valueLng.en,
                        }
                    }
                ],
            },
        );
        if (dataToSend.length > 0) {
            let data = JSON.stringify(dataToSend);
            saveValueOfMultiText(this.props.initialValues.key.split('_')[1], data, moment().format('YYYY-DD-MM')).then(res => {
                message.success(this.props.t("PROPS_SUCCESSFULLY_UPDATED"));
                //console.log(res)
            }).catch(err => {
                console.warn(err);
            })
        }
    }


    render() {
        if (!this.props.tofiConstants) return null;
        const lng = localStorage.getItem('i18nextLng');
        const {
            tofiConstants: {
                orgFunctionFundmaker, structureFundmaker, reasonFundmaker, reasonFundmakerFile, legalStatus, fundNumber, formOfAdmission, departmentalAccessory, orgIndustry, isActive, fundmakerArchive, orgPhone, orgFax, dateFormation,
                orgEmail, orgAddress, orgFormationDoc, orgReorganizationDoc, orgLiquidationDoc, contractNumber, orgDocType,
                subordination, jurisdiction, orgFunction, structure
            }, t, handleSubmit, reset, dirty, error, submitting, legalStatusOptions, accessLevelOptions, orgDocTypeOptions,
            formOfAdmissionOptions, orgIndustryOptions, isActiveOptions, fundmakerArchiveOptions, cubeSConst,
            objSubordinationOptions, departmentalAccessoryOptions
        } = this.props;
        const {lang, loading} = this.state;
        return (
            <Form className="antForm-spaceBetween" onSubmit={handleSubmit(this.onSubmit)}
                  style={dirty ? {paddingBottom: '43px'} : {}}>
                {
                    dateFormation && <Field
                        name="dateFormation"
                        normalize={this.dateToRedux}
                        component={renderDatePicker}
                        disabledDate={this.disabledStartDate}
                        label={dateFormation.name[lng]}
                        format={null}
                        formItemLayout={
                            {
                                labelCol: {span: 10},
                                wrapperCol: {span: 14}
                            }
                        }
                    />
                }
                <Field
                    name="name"
                    component={renderInputLang}
                    format={value => (!!value ? value[lang.name] : '')}
                    parse={value => {
                        this.nameValue[lang.name] = value;
                        return {...this.nameValue}
                    }}
                    label={t('NAME')}
                    formItemClass="with-lang"
                    changeLang={this.changeLang}
                    formItemLayout={
                        {
                            labelCol: {span: 10},
                            wrapperCol: {span: 14}
                        }
                    }
                    validate={requiredLng}
                    colon={true}
                />
                <Field
                    name="shortName"
                    component={renderInputLang}
                    format={value => (!!value ? value[lang.shortName] : '')}
                    parse={value => {
                        this.shortNameValue[lang.shortName] = value;
                        return {...this.shortNameValue}
                    }}
                    label={t('SHORT_NAME')}
                    formItemClass="with-lang"
                    changeLang={this.changeLang}
                    formItemLayout={
                        {
                            labelCol: {span: 10},
                            wrapperCol: {span: 14}
                        }
                    }
                    validate={requiredLng}
                    colon={true}
                />
                <Row>
                    <Col span={24}>
                        {reasonFundmaker && <Field
                            name="reasonFundmaker"
                            component={renderInput}
                            label={reasonFundmaker.name[lng]}
                            normalize={this.strToRedux}
                            formItemLayout={
                                {
                                    labelCol: {span: 10},
                                    wrapperCol: {span: 14}
                                }
                            }
                        />}
                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={10}></Col>
                            <Col span={14}>
                                <Field
                                    name="reasonFundmakerFile"
                                    label=''
                                    component={renderFileUploadBtn}
                                    cubeSConst='cubeForOrgFundmaker'
                                    normalize={this.fileToRedux}
                                    formItemLayout={
                                        {
                                            labelCol: {span: 0},
                                            wrapperCol: {span: 24}
                                        }
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                {orgIndustry && <Field
                    name="orgIndustry"
                    component={renderSelect}
                    normalize={this.selectMultiToRedux}
                    label={orgIndustry.name[lng]}
                    isMulti
                    formItemLayout={
                        {
                            labelCol: {span: 10},
                            wrapperCol: {span: 14}
                        }
                    }
                    isSearchable={false}
                    data={orgIndustryOptions || []}
                    onMenuOpen={this.loadOptions(ORG_INDUSTRY, true)}
                    isLoading={loading.orgIndustryLoading}
                    validate={requiredArr}
                    colon={true}
                />}
                {legalStatus && <Field
                    name="legalStatus"
                    component={renderSelect}
                    normalize={this.selectToRedux}
                    label={legalStatus.name[lng]}
                    formItemLayout={
                        {
                            labelCol: {span: 10},
                            wrapperCol: {span: 14}
                        }
                    }
                    isSearchable={false}
                    data={legalStatusOptions ? legalStatusOptions.map(option => ({
                        value: option.id,
                        label: option.name[lng]
                    })) : []}
                    onMenuOpen={this.loadOptions("legalStatus")}
                    isLoading={loading.legalStatusLoading}
                    validate={requiredLabel}
                    colon={true}
                />}
                <Row>
                    <Col span={24}>
                        {structureFundmaker && <Field
                            name="structureFundmaker"
                            label={structureFundmaker.name[lng]}
                            style={{height: '70px !important', minHeight: '70px !important'}}
                            component={renderTextareaLang}
                            format={value => (!!value ? value.valueLng[lang.structureFundmaker] : "")}
                            normalize={(val, prevVal, obj, prevObj) => {
                                let newVal = {...prevVal};
                                newVal.value = val;
                                if (!!newVal.valueLng) {
                                    newVal.valueLng[lang.structureFundmaker] = val;
                                } else {
                                    newVal["valueLng"] = {kz: "", en: "", ru: ""};
                                    newVal.valueLng[lang.structureFundmaker] = val;
                                }
                                return newVal;
                            }}
                            formItemClass="with-lang"
                            changeLang={this.changeLang}
                            formItemLayout={{
                                labelCol: {span: 10},
                                wrapperCol: {span: 14}
                            }}
                        />}

                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={10}></Col>
                            <Col span={14}>
                                <Field
                                    name="structure"
                                    label=''
                                    component={renderFileUploadBtn}
                                    cubeSConst='cubeForOrgFundmaker'
                                    normalize={this.fileToRedux}
                                    formItemLayout={
                                        {
                                            labelCol: {span: 0},
                                            wrapperCol: {span: 24}
                                        }
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        {orgFunctionFundmaker && <Field
                            name="orgFunctionFundmaker"
                            label={orgFunctionFundmaker.name[lng]}
                            component={renderTextareaLang}
                            format={value => (!!value ? value.valueLng[lang.orgFunctionFundmaker] : '')}
                            normalize={(val, prevVal, obj, prevObj) => {
                                let newVal = {...prevVal};
                                newVal.value = val;
                                if (!!newVal.valueLng) {
                                    newVal.valueLng[lang.orgFunctionFundmaker] = val;
                                } else {
                                    newVal["valueLng"] = {kz: "", en: "", ru: ""};
                                    newVal.valueLng[lang.orgFunctionFundmaker] = val;
                                }
                                return newVal;
                            }}
                            formItemClass="with-lang"
                            changeLang={this.changeLang}
                            formItemLayout={{
                                labelCol: {span: 10},
                                wrapperCol: {span: 14}
                            }}
                        />}

                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={10}></Col>
                            <Col span={14}>
                                <Field
                                    name="orgFunction"
                                    label=''
                                    component={renderFileUploadBtn}
                                    cubeSConst='cubeForOrgFundmaker'
                                    normalize={this.fileToRedux}
                                    formItemLayout={
                                        {
                                            labelCol: {span: 0},
                                            wrapperCol: {span: 24}
                                        }
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>

                {departmentalAccessory && <Field
                    name="departmentalAccessory"
                    component={renderInputLang}
                    format={value => (!!value ? value.valueLng[lang.departmentalAccessory] : '')}
                    normalize={(val, prevVal, obj, prevObj) => {
                        let newVal = {...prevVal};
                        newVal.value = val;
                        if (!!newVal.valueLng) {
                            newVal.valueLng[lang.departmentalAccessory] = val;
                        } else {
                            newVal['valueLng'] = {kz: '', en: '', ru: ''};
                            newVal.valueLng[lang.departmentalAccessory] = val;
                        }
                        return newVal;
                    }}
                    label={departmentalAccessory.name[lng]}
                    formItemClass="with-lang"
                    changeLang={this.changeLang}
                    formItemLayout={
                        {
                            labelCol: {span: 10},
                            wrapperCol: {span: 14}
                        }
                    }
                />}
                {dirty && <Form.Item className="ant-form-btns absolute-bottom">
                    <Button className="signup-form__btn" type="primary" htmlType="submit"
                            disabled={submitting}>
                        {submitting ? t('LOADING...') : t('SAVE')}
                    </Button>
                    <Button className="signup-form__btn" type="danger" htmlType="button"
                            disabled={submitting} style={{marginLeft: '10px'}}
                            onClick={reset}>
                        {submitting ? t('LOADING...') : t('CANCEL')}
                    </Button>
                    {error &&
                    <span className="message-error"><i className="icon-error"/>{error}</span>}
                </Form.Item>}
                {/*<Field
            name="fundNumber"
            component={renderInput}
            placeholder={t('NUMB_OF_IK')}
            normalize={(val, prevVal, obj, prevObj)=>this.strToRedux(val, prevVal, obj, prevObj, true)}
            label={t('NUMB_OF_IK')}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            validate={requiredLng}
            colon={true}
            />

            <Field
            name="dbeg"
            component={renderDatePicker}
            disabledDate={this.disabledStartDate}
            format={null}
            label={t('DBEG')}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />
            <Field
            name="dend"
            component={renderDatePicker}
            disabledDate={this.disabledEndDate}
            format={null}
            label={t('DEND')}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />
            <Field
            name="accessLevel"
            component={renderSelect}
            normalize={this.selectToRedux}
            label={t('ACCESS_LEVEL')}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            isSearchable={false}
            data={accessLevelOptions ? accessLevelOptions.map(option => ({
                value: option.id,
                label: option.name[lng]
            })) : []}
            onMenuOpen={!accessLevelOptions ? this.props.getAccessLevels : undefined}
            colon={true}
            validate={requiredLabel}
            />
            {contractNumber && <Field
            name="contractNumber"
            normalize={(val, prevVal, obj, prevObj)=>this.strToRedux(val, prevVal, obj, prevObj, true)}
            component={renderInput}
            placeholder={contractNumber.name[lng]}
            label={contractNumber.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />
           <Field
            name="formOfAdmission"
            normalize={this.selectToRedux}
            component={renderSelect}
            isSearchable={false}
            label={formOfAdmission.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            data={formOfAdmissionOptions ? formOfAdmissionOptions.map(option => ({
                value: option.id,
                label: option.name[lng]
            })) : []}
            onMenuOpen={this.loadOptions(FORM_OF_ADMISSION)}
            isLoading={loading.formOfAdmissionLoading}
            validate={requiredLabel}
            colon={true}
            />}
            {orgDocType && <Field
            name="orgDocType"
            isMulti
            normalize={this.selectMultiToRedux}
            component={renderSelect}
            isSearchable={false}
            label={orgDocType.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            data={orgDocTypeOptions ? orgDocTypeOptions.map(option => ({
                value: option.id,
                label: option.name[lng]
            })) : []}
            onMenuOpen={this.loadOptions('orgDocType')}
            isLoading={loading.orgDocTypeLoading}
            validate={requiredArr}
            colon={true}
            />}
            {isActive && <Field
            name="isActive"
            component={renderSelect}
            label={isActive.name[lng]}
            normalize={this.selectToRedux}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            isSearchable={false}
            data={isActiveOptions ? isActiveOptions.map(option => ({
                value: option.id,
                label: option.name[lng]
            })) : []}
            onMenuOpen={this.loadOptions(IS_ACTIVE)}
            isLoading={loading.isActiveLoading}
            validate={requiredLabel}
            colon={true}
            />}
            {fundmakerArchive && <Field
            name="fundmakerArchive"
            component={renderSelect}
            normalize={this.selectToRedux}
            label={fundmakerArchive.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            data={fundmakerArchiveOptions ? fundmakerArchiveOptions.map(option => ({
                value: option.id,
                label: option.name[lng]
            })) : []}
            onMenuOpen={this.loadOptions('fundmakerArchive')}
            isLoading={loading.fundmakerArchiveLoading}
            validate={requiredLabel}
            colon={true}
            />}
            {/*       {subordination && <Field
             name="subordination"
             component={ renderSelect }
             label={subordination.name[lng]}
             formItemLayout={
             {
             labelCol: { span: 10 },
             wrapperCol: { span: 14 }
             }
             }
             isSearchable={false}
             data={objSubordinationOptions ? objSubordinationOptions.map(option => ({value: option.id, label: option.name[lng]})) : []}
             onMenuOpen={this.loadChilds('objSubordination')}
             isLoading={loading.objSubordinationLoading}
             // validate={requiredLabel}
             // colon={true}
             />}
             {jurisdiction && <Field
             name="jurisdiction"
             component={ renderSelect }
             label={jurisdiction.name[lng]}
             formItemLayout={
             {
             labelCol: { span: 10 },
             wrapperCol: { span: 14 }
             }
             }
             isSearchable={false}
             data={objSubordinationOptions ? objSubordinationOptions.map(option => ({value: option.id, label: option.name[lng]})) : []}
             onMenuOpen={this.loadChilds('objSubordination')}
             isLoading={loading.objSubordinationLoading}
             // validate={requiredLabel}
             // colon={true}
             />}}
            {orgAddress && <Field
            name="orgAddress"
            component={renderInputLang}
            format={value => (!!value ? value.valueLng[lang.orgAddress] : '')}
            normalize={(val, prevVal, obj, prevObj) => {
                let newVal = {...prevVal}; newVal.value = val;
                if (!!newVal.valueLng){newVal.valueLng[lang.orgAddress] = val;}else
                    {newVal['valueLng']={kz:'',en:'',ru:''};newVal.valueLng[lang.orgAddress] = val;}
                return newVal;
            }}


            label={orgAddress.name[lng]}
            formItemClass="with-lang"
            changeLang={this.changeLang}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />}
            {orgPhone && <Field
            name="orgPhone"
            component={renderInput}
            normalize={(val, prevVal, obj, prevObj)=>this.strToRedux(val, prevVal, obj, prevObj, true)}
            placeholder='+7 ('
            label={orgPhone.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />}
            {orgFax && <Field
            name="orgFax"
            component={renderInput}
            placeholder='+7 ('
            label={orgFax.name[lng]}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            normalize={(val, prevVal, obj, prevObj)=>this.strToRedux(val, prevVal, obj, prevObj, true)}
            />}
            {orgEmail && <Field
            name="orgEmail"
            component={renderInput}
            placeholder='example@example.com'
            label={orgEmail.name[lng]}
            normalize={this.strToRedux}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />}
            {orgFormationDoc && <Field
            name="orgFormationDoc"
            component={renderInputLang}
            format={value => (!!value ? value.valueLng[lang.orgFormationDoc] : '')}
            normalize={(val, prevVal, obj, prevObj) => {
                let newVal = {...prevVal}; newVal.value = val;
                if (!!newVal.valueLng){newVal.valueLng[lang.orgFormationDoc] = val;}else
                {newVal['valueLng']={kz:'',en:'',ru:''};newVal.valueLng[lang.orgFormationDoc] = val;}
                return newVal;
                }}

            label={orgFormationDoc.name[lng]}
            formItemClass="with-lang"
            changeLang={this.changeLang}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />}
            {orgReorganizationDoc && <Field
            name="orgReorganizationDoc"
            component={renderInputLang}
            format={value => (!!value ? value.valueLng[lang.orgReorganizationDoc] : '')}
            normalize={(val, prevVal, obj, prevObj) => {
                let newVal = {...prevVal}; newVal.value = val;
                if (!!newVal.valueLng){newVal.valueLng[lang.orgReorganizationDoc] = val;}else
                {newVal['valueLng']={kz:'',en:'',ru:''};newVal.valueLng[lang.orgReorganizationDoc] = val;}
                return newVal;
            }}
            label={orgReorganizationDoc.name[lng]}
            formItemClass="with-lang"
            changeLang={this.changeLang}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />}
            {orgLiquidationDoc && <Field
            name="orgLiquidationDoc"
            component={renderInputLang}
            format={value => (!!value ? value.valueLng[lang.orgLiquidationDoc] : '')}
            normalize={(val, prevVal, obj, prevObj) => {
                let newVal = {...prevVal}; newVal.value = val;
                if (!!newVal.valueLng){newVal.valueLng[lang.orgLiquidationDoc] = val;}else
                {newVal['valueLng']={kz:'',en:'',ru:''};newVal.valueLng[lang.orgLiquidationDoc] = val;}
                return newVal;
            }}
            label={orgLiquidationDoc.name[lng]}
            formItemClass="with-lang"
            changeLang={this.changeLang}
            formItemLayout={
                {
                    labelCol: {span: 10},
                    wrapperCol: {span: 14}
                }
            }
            />*/}
                    </Form>
                    )
                    }
                }

                const selector = formValueSelector('MainInfoFundMaker');

                function mapStateToProps(state) {
                const dbegValue = selector(state, 'dbeg');
                const dendValue = selector(state, 'dend');
                const lng = localStorage.getItem('i18nextLng');
                const orgIndOpts = state.generalData[ORG_INDUSTRY] && state.generalData[ORG_INDUSTRY]
                .map(option => ({
                value: option.id,
                label: option.name[lng],
                hasChild: option.hasChild,
                parent: option.parent
            }));
                return {
                dbegValue,
                dendValue,
                legalStatusOptions: state.generalData[LEGAL_STATUS],
                formOfAdmissionOptions: state.generalData[FORM_OF_ADMISSION],
                orgIndustryOptions: orgIndOpts,
                isActiveOptions: state.generalData[IS_ACTIVE],
                fundmakerArchiveOptions: state.generalData[FUND_MAKER_ARCHIVE],
                orgDocTypeOptions: state.generalData[ORG_DOC_TYPE],
                objSubordinationOptions: state.generalData.objSubordination,
                accessLevelOptions: state.generalData.accessLevel,
                cubeForFundAndIKSingle: state.cubes.cubeForFundAndIKSingle
            }
            }

                export default connect(
                mapStateToProps,
                {getPropVal, getCube, getAccessLevels, getObjChildsByConst, getPropValWithChilds}
                )(reduxForm({form: 'MainInfoFundMaker', enableReinitialize: true})(MainInfoFundMaker));
