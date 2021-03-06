import React from 'react';
import AntTabs from '../../AntTabs';
import IDData from './IDData';
import Status from './Status';
import {getObjChildsByConst, getPropVal, getRoles, setRoles, getRolesUser} from "../../../actions/actions";
import {connect} from "react-redux";
import {formValueSelector, change} from "redux-form";
import {isEmpty, pickBy, isEqual} from "lodash";
import {SYSTEM_LANG_ARRAY} from "../../../constants/constants";

class StaffCard extends React.PureComponent {

    state = {
        genderLoading: false,
        objNationalityLoading: false,
        educationLoading: false,
        personAcademicTitleLoading: false,
        personAcademicDegreeLoading: false,
        objStudyParentLoading: false,
        directUseDocumentLoading: false,
        formResultRealizationLoading: false,
        staffRoleLoading: false,
        rolesLoading: false,
        rolesOptions: []
    };

    onSubmit = values => {
        const {photo, copyUdl, researcherClassObj, roles, ...toSend} = pickBy(values, (val, key) => !isEqual(val, this.props.initialValues[key]));
        const cube = {
            cubeSConst: 'cubeUsers',
            doConst: 'doUsers',
            dpConst: 'dpUsers'
        };
        const obj = {doItem: this.props.initialValues.key};
        const objData = {};
        if (toSend.personLastName || toSend.personName || toSend.personPatronymic) {
            const {
                personLastName: personLastNameInit,
                personName: personNameInit,
                personPatronymic: personPatronymicInit
            } = this.props.initialValues;
            const name = {};
            const pesonLastNameToSend = toSend.personLastName || personLastNameInit;
            const personNameToSend = toSend.personName || personNameInit;
            const personPatronymicToSend = toSend.personPatronymic || personPatronymicInit;
            SYSTEM_LANG_ARRAY.forEach(lang => {
                name[lang] = `${pesonLastNameToSend.value} ${personNameToSend.value} ${personPatronymicToSend.value}`.trim();
            });
            objData.name = name;
            objData.fullName = name;
        }
        if (!isEmpty(researcherClassObj)) {
            objData.clsConst = researcherClassObj.researcherClass;
        }
        // set roles as a side-effect if changed
        if (roles) setRoles(this.props.initialValues.key.split('_')[1], roles.map(o => o.value).join(','));
        return this.props.saveProps({cube, obj}, {
            values: toSend,
            oFiles: {photo: [photo], copyUdl: [copyUdl]}
        }, this.props.tofiConstants, objData);
    };

    handleTabChange = key => {
        if(key === 'Status') {
            this.loadUserRoles();
        }
    };

    loadOptions = c => {
        return () => {
            if (!this.props[c + 'Options']) {
                this.setState({[c + 'Loading']: true});
                this.props.getPropVal(c)
                    .then(() => this.setState({[c + 'Loading']: false}))
                    .catch(err => console.error(err))
            }
        }
    };

    loadChilds = (c, props) => {
        return () => {
            if (!this.props[c + 'Options']) {
                this.setState({[c + 'Loading']: true});
                this.props.getObjChildsByConst(c, props)
                    .then(() => this.setState({[c + 'Loading']: false}))
                    .catch(err => console.error(err))
            }
        }
    };

    loadRolesOptions = () => {
        this.setState({rolesLoading: true});
        getRoles()
            .then(res => {
                this.setState({rolesLoading: false, rolesOptions: res.data})
            })
            .catch(err => {
                this.setState({rolesLoading: false});
                console.error(err)
            })
    };

    loadUserRoles = () => {
        const key = this.props.initialValues.key;
        if (key) {
            getRolesUser(key.split('_')[1])
                .then(res => this.setState({roles: res.data.map(o => ({ value: o.id, label: o.name[this.lng] }))}))
                .catch(err => console.warn(err))
        }
    };

    componentDidUpdate(prevProps) {
        if(prevProps.initialValues != this.props.initialValues) {
            this.loadUserRoles();
        }
    }

    render() {
        const {t, tofiConstants, initialValues, saveProps, onCreateObj} = this.props;
        this.lng = localStorage.getItem('i18nextLng');

        return (
            <AntTabs
                onChange={this.handleTabChange}
                tabs={[
                    {
                        tabKey: 'IDData',
                        tabName: t('ID_DATA'),
                        tabContent: <IDData
                            tofiConstants={tofiConstants}
                            saveProps={saveProps}
                            onSubmit={this.onSubmit}
                            t={t}
                            initialValues={pickBy(initialValues, val => !isEmpty(val))}
                            onCreateObj={onCreateObj}
                            loadOptions={this.loadOptions}
                            loadChilds={this.loadChilds}
                            genderOptions={this.props.genderOptions}
                            genderLoading={this.state.genderLoading}
                            objNationalityOptions={this.props.objNationalityOptions}
                            objNationalityLoading={this.state.objNationalityLoading}
                        />
                    },
                    {
                        tabKey: 'Status',
                        tabName: t('STATUS'),
                        tabContent: <Status
                            tofiConstants={tofiConstants}
                            saveProps={saveProps}
                            onSubmit={this.onSubmit}
                            t={t}
                            user={this.props.user}
                            initialValues={{...initialValues, roles: this.state.roles}}
                            loadOptions={this.loadOptions}
                            loadRolesOptions={this.loadRolesOptions}
                            rolesLoading={this.state.rolesLoading}
                            rolesOptions={this.state.rolesOptions}
                            educationLoading={this.state.educationLoading}
                            educationOptions={this.props.educationOptions}
                            staffRoleLoading={this.state.staffRoleLoading}
                            staffRoleOptions={this.props.staffRoleOptions}
                            personAcademicTitleLoading={this.state.personAcademicTitleLoading}
                            personAcademicTitleOptions={this.props.personAcademicTitleOptions}
                            personAcademicDegreeLoading={this.state.personAcademicDegreeLoading}
                            personAcademicDegreeOptions={this.props.personAcademicDegreeOptions}
                        />
                    },
                    // {
                    //   tabKey: 'Contacts',
                    //   tabName: t('CONTACTS'),
                    //   tabContent: <Contacts
                    //     tofiConstants={tofiConstants}
                    //     saveProps={saveProps}
                    //     onSubmit={this.onSubmit}
                    //     t={t}
                    //     initialValues={initialValues}
                    //   />
                    // },
                    // {
                    //   tabKey: 'Researches',
                    //   tabName: t('RESEARCHES'),
                    //   tabContent: <Researches
                    //     tofiConstants={tofiConstants}
                    //     saveProps={saveProps}
                    //     t={t}
                    //     initialValues={initialValues}
                    //     loadOptions={this.loadOptions}
                    //     loadChilds={this.loadChilds}
                    //     themeValue={this.props.themeValue}
                    //     change={this.props.change}
                    //     objStudyParentOptions={this.props.objStudyParentOptions}
                    //     objStudyParentLoading={this.state.objStudyParentLoading}
                    //     directUseDocumentOptions={this.props.directUseDocumentOptions}
                    //     directUseDocumentLoading={this.state.directUseDocumentLoading}
                    //     formResultRealizationOptions={this.props.formResultRealizationOptions}
                    //     formResultRealizationLoading={this.props.formResultRealizationLoading}
                    //   />
                    // },
                ]}/>
        )
    }
}

const selector = formValueSelector('signUpForm');

function mapStateToProps(state) {
    const themeValue = selector(state, 'theme');
    return {
        themeValue,
        genderOptions: state.generalData.gender,
        objNationalityOptions: state.generalData.objNationality,
        educationOptions: state.generalData.education,
        personAcademicDegreeOptions: state.generalData.personAcademicDegree,
        personAcademicTitleOptions: state.generalData.personAcademicTitle,
        objStudyParentOptions: state.generalData.objStudyParent,
        directUseDocumentOptions: state.generalData.directUseDocument,
        formResultRealizationOptions: state.generalData.formResultRealization,
        staffRoleOptions: state.generalData.staffRole,
        user: state.auth.user
    }
}

export default connect(mapStateToProps, {getPropVal, getObjChildsByConst, change})(StaffCard);