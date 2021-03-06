import React from 'react';
import {Button, message, Icon, DatePicker, Modal, Input} from 'antd';
import {CSSTransition} from "react-transition-group";
import {connect} from "react-redux";
import AntTable from '../../AntTable';
import InquiryReqCard from './InquiryReqCard';
import {onSaveCubeData, parseCube_new, parseForTable} from "../../../utils/cubeParser";
import {createObj, getCube} from "../../../actions/actions";
import SiderCard from "../../SiderCard";
import {isEmpty, isEqual} from "lodash";
import Select from "../../Select";
import moment from "moment/moment";
import Viewer from "../../Viewer";
import {acceptedTOFIDate} from '../../DPickerTOFI';
import {SYSTEM_LANG_ARRAY} from "../../../constants/constants";
import {DO_FOR_WORKS} from "../../../constants/tofiConstants";
import {ExcelLoader} from "../../../utils/Excel_loader";

class InquiryReqs extends React.Component {

  state = {
    loading: false,
    selectedRow: null,
    openCard: false,
    openModal: false,
    initialValues: {},
    data: [],
    viewerList: [],
    filter: {
      workDate: {
        dbeg: null,
        dend: null
      },
      workPlannedEndDate: {
        dbeg: null,
        dend: null
      },
      workEndDate: {
        dbeg: null,
        dend: null
      },
      researchTypeClass: [],
      personLastName: '',
        nameResearchers:''
    }
  };

  componentDidMount() {
    if(isEmpty(this.props.tofiConstants)) return;
    const getClsId = c => this.props.tofiConstants[c].id;

    // mapping between researchClass and workClass (used when created new related work
    this.researchClsWorkClsMap = {
      'clsResearches': 'conductResearch',
      'clsOrders': 'performPaidReq',
      'clsArchivalReferences': 'responseToRequest'
    };

    this.clsThemeMap = {
      [getClsId('clsArchivalReferences')]: 'requestSubject',
      [getClsId('clsResearches')]: 'propStudy',
      [getClsId('clsOrders')]: 'propStudy',
    };
    this.getCubeAct();
  }
  onDateChange = (name, dateType) => {
    return date => {
      this.setState({filter: {...this.state.filter, [name]: {...this.state.filter[name], [dateType]: date}}})
    }
  };
  onInputChange = e => {
    this.setState({
      filter: {
        ...this.state.filter,
        [e.target.name]: e.target.value
      }
    })
  };
  emitEmpty = e => {
    this.setState({filter: {
        ...this.state.filter,
        [e.target.dataset.name]: ''
      }})
  };
  onResearchClassChange = s => this.setState(prevState => ({ filter: {...prevState.filter, researchTypeClass: s }}));

  getCubeAct() {
    this.setState({ loading: true });
    const filter = {
      filterDOAnd: [
        {
          dimConst: 'doCubeStudy',
          concatType: "and",
          conds: [
            {
              data: {
                valueRef: {
                  id: `wa_${this.props.user.obj}`
                }
              }
            }
          ]
        }
      ],
    };
    this.props.getCube('cubeStudy', JSON.stringify(filter));
  }

  async componentDidUpdate(prevProps) {
    if(isEmpty(this.props.tofiConstants)) return;
    const {tofiConstants: {doCubeStudy, dpCubeStudy}} = this.props;
    if(prevProps.cubeStudy !== this.props.cubeStudy) {
      const parsedCube = parseCube_new(
        this.props.cubeStudy['cube'],
        [],
        'dp',
        'do',
        this.props.cubeStudy[`do_${doCubeStudy.id}`],
        this.props.cubeStudy[`dp_${dpCubeStudy.id}`],
        `do_${doCubeStudy.id}`,
        `dp_${dpCubeStudy.id}`);

      this.setState({
        loading: false,
        data: parsedCube.map(this.renderTableData)
      });
    }
  }

  changeSelectedRow = rec => {
    if(isEmpty(this.state.selectedRow) || (!isEqual(this.state.selectedRow, rec) && !this.state.openCard)){
      this.setState({ selectedRow: rec })
    } else {
      this.setState({ initialValues: rec, openCard: true, selectedRow: rec })
    }
  };

  renderTableData = (item, idx) => {
    const researchTypeClasses = ['clsResearches', 'clsOrders', 'clsArchivalReferences'];
    const constArr = ["workDate","workDescription","workAuthor","workEndDate","resultResearch",
      "formulationResearch","casesResearch","docsResearch","requestSource",
      "resultDescription","propStudy","regNumber","outNumber","nameOfOrganizationDeveloper",
      "dateOfBirth","personAddress","personPhone","personEmail","personLastName","personName","personPatronymic",
      "caseDocsLang","requestType","theme","nationality","usersOfSystem","fundmakerOfIK","caseDbeg","caseDend",
      "workPlannedEndDate","iin","documentContent","workAssignedTo"];
    const researchTypeClass = researchTypeClasses.find(cls => this.props.tofiConstants[cls].id == item.clsORtr);
    const result = {
      key: item.id,
      name: item.name,
      researchTypeClass,
      researchType: researchTypeClass ?
        {
          value: this.props.tofiConstants[researchTypeClass].id,
          label: this.props.tofiConstants[researchTypeClass].name[this.lng],
          researchTypeClass
        } : null,
    };
    // parseForTable(item.props, this.props.tofiConstants, result, constArr);
    parseForTable(item.props, this.props.tofiConstants, result, constArr);
    // Here goes some data massage
    result.researchTheme = result[this.clsThemeMap[item.clsORtr]];

    // result.documentContent = result.documentContentLng;
    // result.resultDescription = result.resultDescriptionLng;
    return result;
  };

  openCard = () => {
    this.setState({
      openCard: true,
      initialValues: {
        workDate: moment(),
        workAuthor: {value: this.props.user.obj, label: this.props.user.name}
      }
    })
  }
  closeCard = () => {
    this.setState({ openCard: false })
  };

  /*changeStatus = (key, name) => {
    const obj = { doItem: key };
    return e => {
      e.stopPropagation();
      const newData = this.state.data.slice();
      const target = newData.find(el => el.key === key);
      if(target) {
        this.saveProps({obj}, {values: {researcheStatus: {value: this.props.tofiConstants[name].id}}})
      }
      this.setState({ data: newData });
    };
  };*/

  createNewWork = async objResearch => {
    const cube = {
      cubeSConst: 'cubeForWorks',
      doConst: 'doForWorks',
      dpConst: 'dpForWorks'
    };

    const name = {};
    SYSTEM_LANG_ARRAY.forEach(lang => {
      name[lang] = `fromResearch_${objResearch.doItem}`;
    });
    const obj = {
      clsConst: this.researchClsWorkClsMap[objResearch.clsConst],
      name,
      fullName: name,
      dbeg: moment().format('YYYY-MM-DD'),
    };
    let hideCreateObj;
    try {
      hideCreateObj = message.loading(this.props.t('CREATING_NEW_OBJECT'), 0);
      const res = await createObj({cubeSConst: cube.cubeSConst}, obj);
      hideCreateObj();
      if(!res.success) {
        res.errors.forEach(err => {
          message.error(err.text)
        });
        return Promise.reject(res)
      }
      obj.doItem = res.data.idItemDO;
      // get works cube to give it onSaveCubeData
      const filters = {
        filterDOAnd: [{
          dimConst: cube.doConst,
          concatType: 'and',
          conds: [{
            ids: res.data.idItemDO
          }]
        }]
      };
      await this.props.getCube(cube.cubeSConst, JSON.stringify(filters));
      cube.data = this.props.cubeForWorks;
      const v = {
        values: {
          workStatusForResearches: String(this.props.tofiConstants.created.id),
          workDate: moment(),
          workAuthor: String(this.props.user.obj),
          propResearcheRequests: objResearch.doItem.split('_')[1]
        }
      };
      return this.saveProps(
        {cube, obj},
        v,
        this.props.tofiConstants
      );
    } catch (e) {
      typeof hideCreateObj === 'function' && hideCreateObj();
      console.warn(e)
    }
  };
  onCreateObj = async ({cube, obj}, v) => {

    let hideCreateObj;
    try {
      hideCreateObj = message.loading(this.props.t('CREATING_NEW_OBJECT'), 0);
      const res = await createObj({cubeSConst: cube.cubeSConst}, obj);
      hideCreateObj();
      if(!res.success) {
        res.errors.forEach(err => {
          message.error(err.text)
        });
        return Promise.reject(res)
      }
      obj.doItem = res.data.idItemDO;
      this.createNewWork(obj);
      return this.saveProps(
        {cube, obj},
        v,
        this.props.tofiConstants
      );
    } catch (e) {
      typeof hideCreateObj === 'function' && hideCreateObj();
      console.warn(e)
    }
  };
  saveProps = async (c, v, t = this.props.tofiConstants, objData) => {

    let hideLoading;
    try {
      if(!c.cube) c.cube = {
        cubeSConst: 'cubeStudy',
        doConst: 'doCubeStudy',
        dpConst: 'dpCubeStudy',
      };
      if(!c.cube.data) c.cube.data = this.props.cubeStudy;
      hideLoading = message.loading(this.props.t('UPDATING_PROPS'), 0);
      const resSave = await onSaveCubeData(c, v, t, objData);
      hideLoading();
      if(!resSave.success) {
        message.error(this.props.t('PROPS_UPDATING_ERROR'));
        resSave.errors.forEach(err => {
          message.error(err.text)
        });
        return Promise.reject(resSave);
      }
      message.success(this.props.t('PROPS_SUCCESSFULLY_UPDATED'));
      this.setState({loading: true, openCard: false});
      await this.getCubeAct();
      return resSave;
    }
    catch (e) {
      typeof hideLoading === 'function' && hideLoading();
      this.setState({ loading: false });
      console.warn(e);
    }
  };

  render() {
    if(isEmpty(this.props.tofiConstants)) return null;
    this.lng = localStorage.getItem('i18nextLng');
    const { loading, data, researchTypeClass, filter } = this.state;
    const { t, tofiConstants, tofiConstants: { workDate, propStudy, researcheStatus,
      regNumber,outNumber, workEndDate, resultResearch, workPlannedEndDate } } = this.props;

    this.filteredData = data.filter(item => {
      return (
        (filter.researchTypeClass.length === 0 || filter.researchTypeClass.some(p => (p.researchTypeClass == item.researchTypeClass))) &&
        ( item.key ? item.key.toLowerCase().includes(filter.nameResearchers.toLowerCase()) : filter.nameResearchers === '') &&
        ( !filter.workDate.dbeg || !!item.workDate && moment(item.workDate.value, 'DD-MM-YYYY').isSameOrAfter(filter.workDate.dbeg, 'day') ) &&
        ( !filter.workDate.dend || !!item.workDate && moment(item.workDate.value, 'DD-MM-YYYY').isSameOrBefore(filter.workDate.dend, 'day') ) &&
        ( !filter.workEndDate.dbeg || !!item.workEndDate &&  moment(item.workEndDate.value, 'DD-MM-YYYY').isSameOrAfter(filter.workEndDate.dbeg, 'day') ) &&
        ( !filter.workEndDate.dend || !!item.workEndDate &&  moment(item.workEndDate.value, 'DD-MM-YYYY').isSameOrBefore(filter.workEndDate.dend, 'day') ) &&
        ( !filter.workPlannedEndDate.dbeg ||  !!item.workPlannedEndDate && moment(item.workPlannedEndDate.value, 'DD-MM-YYYY').isSameOrAfter(filter.workPlannedEndDate.dbeg, 'day') ) &&
        ( !filter.workPlannedEndDate.dend ||  !!item.workPlannedEndDate &&  moment(item.workPlannedEndDate.value, 'DD-MM-YYYY').isSameOrBefore(filter.workPlannedEndDate.dend, 'day') )
      )
    });

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'key',
            width: '10%',
            render: key => key ? key.slice(5,8)+'-'+key.slice(-4) : '',
            sortOrder:'descend',
            sorter: (a, b) => parseInt(a.key.split('_')[1]) - parseInt(b.key.split('_')[1]),
            filterDropdown: (
                <div className="custom-filter-dropdown">
                  <Input
                      disabled={this.state.openCard}
                      name="nameResearchers"
                      suffix={filter.nameResearchers && !this.state.openCard ?
                          <Icon type="close-circle" data-name="nameResearchers"
                                onClick={this.emitEmpty}/> : null}
                      ref={ele => this.nameResearchers = ele}
                      placeholder="Поиск"
                      value={filter.nameResearchers}
                      onChange={this.onInputChange}
                  />
                </div>
            ),
            filterIcon: <Icon type="filter"
                              style={{color: filter.nameResearchers ? '#ff9800' : '#aaa'}}/>,
            onFilterDropdownVisibleChange: (visible) => {
                this.setState({
                    filterDropdownVisible: visible,
                }, () => this.nameResearchers.focus());
            },
        },
      {
        key: 'researchType',
        title: t('RESEARCH_CLASS'),
        dataIndex: 'researchType',
        width: '10%',
        render: obj =>  obj && obj.label
      },
      {
        key: 'regNumber',
        title: regNumber.name[this.lng],
        dataIndex: 'regNumber',
        render: (key, obj) => {return key.value},
        width: '10%'

      },
      {
        key: 'workDate',
        title: workDate.name[this.lng],
        dataIndex: 'workDate',
        width: '10%',
        filterDropdown: (
          <div className="custom-filter-dropdown">
            <div className="flex">
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workDate.dbeg}
                style={{marginRight: '16px'}}
                showToday={false}
                onChange={this.onDateChange('workDate', 'dbeg')}
              />
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workDate.dend}
                showToday={false}
                onChange={this.onDateChange('workDate', 'dend')}
              />
            </div>
          </div>
        ),
        filterIcon: <Icon type="filter" style={{ color: (filter.workDate.dbeg || filter.workDate.dend) ? '#ff9800' : '#aaa' }} />,
        // render: obj => obj && acceptedTOFIDate(obj) && obj.format('DD-MM-YYYY')
        render: (key, obj) => !!key && key.value ,
      },
      {
        key: 'applicant',
        title: t('APPLICANT'),
        dataIndex: 'applicant',
        width: '10%',
        // render: (obj, rec) =>(rec.nameOfOrganizationDeveloper || '').value + ' ' + (rec.personLastName || '').value

        render: (obj, rec) =>(rec.nameOfOrganizationDeveloper ? rec.nameOfOrganizationDeveloper.value : '') + ' ' + (rec.personLastName ? rec.personLastName.value : '') + ' ' +
        (rec.personName ? rec.personName.value : '') + ' ' + (rec.personPatronymic ? rec.personPatronymic.value : '')
      },
      {
        key: 'workPlannedEndDate',
        title: t('PLANNED_END_DATE'),
        dataIndex: 'workPlannedEndDate',
        width: '11%',
        filterDropdown: (
          <div className="custom-filter-dropdown">
            <div className="flex">
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workPlannedEndDate.dbeg}
                style={{marginRight: '16px'}}
                showToday={false}
                onChange={this.onDateChange('workPlannedEndDate', 'dbeg')}
              />
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workPlannedEndDate.dend}
                showToday={false}
                onChange={this.onDateChange('workPlannedEndDate', 'dend')}
              />
            </div>
          </div>
        ),
        filterIcon: <Icon type="filter" style={{ color: (filter.workPlannedEndDate.dbeg || filter.workPlannedEndDate.dend) ? '#ff9800' : '#aaa' }} />,
          render: (key, obj) => !!key && key.value ,

      },
        {
            key: 'propStudy',
            title: propStudy.name[this.lng],
            dataIndex: 'propStudy',
            width: '10%',
            render: obj => {
              if(!!obj){
                let newarr =[]
                for(let item of obj){
                  newarr.push(item.label)
                }
                return newarr.join(",")
              }else {
                return ""
              }
            }
        }
      ,
      /*{
        key: 'researcheStatus',
        title: researcheStatus.name[this.lng],
        dataIndex: 'researcheStatus',
        width: '10%',
        render: obj => obj && obj.label
      },*/
      {
        key: 'workEndDate',
        title: t('FACT_END_DATE'),
        dataIndex: 'workEndDate',
        width: '13%',
        filterDropdown: (
          <div className="custom-filter-dropdown">
            <div className="flex">
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workEndDate.dbeg}
                style={{marginRight: '16px'}}
                showToday={false}
                onChange={this.onDateChange('workEndDate', 'dbeg')}
              />
              <DatePicker
                format="DD-MM-YYYY"
                value={this.state.filter.workEndDate.dend}
                showToday={false}
                onChange={this.onDateChange('workEndDate', 'dend')}
              />
            </div>
          </div>
        ),
        filterIcon: <Icon type="filter" style={{ color: (filter.workEndDate.dbeg || filter.workEndDate.dend) ? '#ff9800' : '#aaa' }} />,
          render: (key, obj) => !!key && key.value ,

      },
      /*{
        key: 'resultResearch',
        title: resultResearch.name[this.lng],
        dataIndex: 'resultResearch',
        width: '8%',
        render: vals => vals && vals.length &&
          <Button
            title={t('SHOW_FILES')}
            icon="paper-clip"
            className='green-btn'
            onClick={e => {
              e.stopPropagation();
              this.setState({openModal: true, viewerList: vals})
            }}
          />,
      },*/
      /*{
        key: 'action',
        title: '',
        dataIndex: 'action',
        width: '6%',
        render: (text, record) => {
          return (
            <div className="editable-row-operations">
              <span>
                <Button title={t('COMPLETED')} icon="check-circle" className='green-btn' onClick={this.changeStatus(record.key, 'fvCompleted')} />
                <Button title={t('DENIED')} icon="close" onClick={this.changeStatus(record.key, 'denied')} className='green-btn'/>
              </span>
            </div>
          );
        },
      },*/
    ];

    return (
      <div className='Works'>
        <div className="title">
          <h2>{t('QUERIES')}</h2>
        </div>
        <div className="Works__heading">
          <div className="table-header" style={{ justifyContent: 'unset' }}>
            <Button style={{ margin: '0 3px' }} onClick={this.openCard}>{t('ADD')}</Button>
            <ExcelLoader columns={columns} data={this.filteredData}/>
            {/*<Button style={{ margin: '0 3px' }} onClick={() => this.setState({ openCard: true })}>{t('RECEIVE_FROM_EGOV')}</Button>
            <Button style={{ margin: '0 3px' }} onClick={() => this.setState({ openCard: true })}>{t('SEND_TO_EGOV')}</Button>*/}
            <div className="label-select" style={{ flex: '0 0 20%' }}>
              <Select
                name="researchTypeClass"
                isMulti
                isSearchable={false}
                value={researchTypeClass}
                onChange={this.onResearchClassChange}
                options={['clsResearches', 'clsOrders', 'clsArchivalReferences']
                  .map(c => ({value: tofiConstants[c].id, label: tofiConstants[c].name[this.lng], researchTypeClass: c}))}
                placeholder={t('RESEARCH_CLASS')}
              />
            </div>
          </div>
        </div>
        <div className="Works__body">
          <AntTable
            loading={loading}
            dataSource={this.filteredData}
            changeSelectedRow={this.changeSelectedRow}
            openedBy="Works"
            columns={columns}
          />
          <CSSTransition
            in={this.state.openCard}
            timeout={300}
            classNames="card"
            unmountOnExit
          >
            <SiderCard
              closer={<Button type='danger' onClick={this.closeCard} shape="circle" icon="arrow-right"/>}
            >
              <InquiryReqCard
                t={t}
                user={this.props.user}
                tofiConstants={tofiConstants}
                initialValues={this.state.initialValues}
                onCreateObj={this.onCreateObj}
                saveProps={this.saveProps}
                clsThemeMap={this.clsThemeMap}
                isHidden={false}
                isEnabled={true}
              />
            </SiderCard>
          </CSSTransition>
        </div>
        {<Modal
          visible={this.state.openModal}
          footer={null}
          title={t('VIEWER')}
          wrapClassName={'full-screen'}
          onCancel={() => this.setState({ openModal: false })}
        >
          <Viewer key={this.state.viewerList.toString()} viewerList={this.state.viewerList} editable/>
        </Modal>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    cubeForWorks: state.cubes.cubeForWorks,
    cubeStudy: state.cubes.cubeStudy,
    user: state.auth.user,
    tofiConstants: state.generalData.tofiConstants
  }
}

export default connect(mapStateToProps, { getCube })(InquiryReqs);
