import React from 'react';
import {Button, message, Icon, DatePicker, Modal, Input} from 'antd';
import {CSSTransition} from "react-transition-group";
import SiderCard from "../../SiderCard";
import CabinetCard from "./CabinetCard";
import AntTable from '../../AntTable';
import {parseCube_new, parseForTable} from "../../../utils/cubeParser";
import {isEmpty, isEqual} from "lodash";
import {getObjByProp, getObjListNew} from "../../../actions/actions";
import Viewer from "../../Viewer";
import moment from "moment/moment";
import Select from "../../Select.js"

class Requests extends React.Component {

  state = {
    sortState: true,
    search: {
      workDate: {
        dbeg: null,
        dend: null
      },
      acceptanceDate: {
        dbeg: null,
        dend: null
      },
      permitionDate: {
        dbeg: null,
        dend: null
      },
        nameResearchers:'',
      workTypeClass: []

    },
    loading: false,
    selectedRow: null,
    openCard: false,
    initialValues: {},
    data: [],
    viewerList: [],
    openModal: false
  };

    onChange = (pagination, filters, sorter) => {
        if(sorter.columnKey === "key") {
            this.setState({sortState: !this.state.sortState});
        }
    }

  onDateChange = (name, dateType) => {
    return date => {
      this.setState({search: {...this.state.search, [name]: {...this.state.search[name], [dateType]: date}}})
    }
  };
  onInputChange = e => {
    this.setState({
      search: {
        ...this.state.search,
        [e.target.name]: e.target.value
      }
    })
  };

onWorkClassChange = s => {
  this.setState({
    search: {
      ...this.state.search,
    workTypeClass: s
  }
})

}
  emitEmpty = e => {
    this.setState({search: {
        ...this.state.search,
        [e.target.dataset.name]: ''
      }})
  };

  closeCard = () => {
    this.setState({openCard: false});
  };

  getDocs = async (caseId) => {
    try {
      const fd = new FormData();
      fd.append('clsConsts', 'docUprList,docNTDList,docMovieList,docPhotoList,docPhonoList,docVideoList');
      fd.append('propConst', 'documentCase');
      fd.append('value', caseId);
      const objsByProp = await getObjByProp(fd);
      if(!objsByProp.success) {
        objsByProp.errors.forEach(err => {
          message.error(err.text);
        });
        return Promise.reject();
      }
      if(!objsByProp.data.length) {
        message.warning(this.props.t('NO_DOCS_OF_CASE'));
        return Promise.reject('NO_DOCS_OF_CASE');
      }
      return objsByProp;
    } catch (e) {
      console.warn(e);
    }
  };

  componentDidMount() {
    if(isEmpty(this.props.tofiConstants)) return;
    const getClsId = c => this.props.tofiConstants[c].id;

    this.clsStatusMap = {
      [getClsId('caseDeliveryToRR')]: 'workStatusCreateRequirement',
      [getClsId('orderCopyDoc')]: 'workStatusCopyDoc',
      [getClsId('userRegistration')]: 'workStatusRegistration'
    };
    if(!this.state.data.length && this.props.cubeForWorks) {
      this.populate();
    }
  }

  changeSelectedRow = rec => {

    if(isEmpty(this.state.selectedRow) || (!isEqual(this.state.selectedRow, rec) && !this.state.openCard)){
      this.setState({ selectedRow: rec })
    } else {
      this.setState({ initialValues: rec, openCard: true, selectedRow: rec })
    }
  };

  populate = async () => {
    if (isEmpty(this.props.tofiConstants)) return;
    const {tofiConstants: {doForWorks, dpForWorks}} = this.props;
    try {
      this.workRegCaseIds = [];
      const parsedCube = parseCube_new(
        this.props.cubeForWorks['cube'],
        [],
        'dp',
        'do',
        this.props.cubeForWorks[`do_${doForWorks.id}`],
        this.props.cubeForWorks[`dp_${dpForWorks.id}`],
        `do_${doForWorks.id}`,
        `dp_${dpForWorks.id}`).map(this.renderTableData);
      if(this.workRegCaseIds.length) {
        const fd = new FormData();
        fd.append('ids', this.workRegCaseIds.join(','));
        fd.append('propConsts', 'archiveCipher,documentFile');
        const workCaseData = await getObjListNew(fd);
        if(!workCaseData.success) {
          workCaseData.forEach(err => {
            message.error(err.text);
          });
          return;
        }
        workCaseData.data.forEach(item => {
          parsedCube.filter(o => o.workRegCase && o.workRegCase.value == item.id)
            .forEach(result => {
              result.archiveCipher = item.archiveCipher;
              result.documentFile = item.documentFile;
            });
          // result.workCaseName = item.name; Maybe I don't need it, because I already have workRegCase's label
        });
      }
      this.setState(
        {
          loading: false,
          data: parsedCube
        }
      );
    } catch (e) {
      console.warn(e);
    }
  };

  componentDidUpdate(prevProps) {
    if (prevProps.cubeForWorks !== this.props.cubeForWorks) {
      this.populate();
    }
  }
  // готовит данные для отображения в таблице
  renderTableData = (item, idx) => {
    const workTypeClasses = ['caseDeliveryToRR', 'orderCopyDoc', 'userRegistration'];
    const constArr = ['permitionDate', 'workAuthor', 'fundArchive', 'tookUser', 'workRecipient', 'appointedUser',
      'workPriority', 'workDate', 'workAssignedTo', 'workActualStartDate', 'dateAppointment', 'workRegFund', 'workRegInv',
      'workActualEndDate', 'acceptanceDate', 'customerReqs', 'reasonForRefusalCase', 'reasonForRefusalCaseStorage',
      'workStatusCreateRequirement', 'workRegCase', 'linkToDoc', 'linkToUkaz', 'workStatusCopyDoc', 'docsResearch',
      'resultDescription', 'resultResearch'];
    // определяем класс работы
    const workTypeClass = workTypeClasses.find(cls => this.props.tofiConstants[cls].id == item.clsORtr);
    const result = {
      key: item.id,
      name: item.name,
      parent: item.parent,
      workType: workTypeClass ? {value: this.props.tofiConstants[workTypeClass].id, label: this.props.tofiConstants[workTypeClass].name[this.lng], workTypeClass} : '',
    };
    // Добавляем к 4-м ключам все пропы из constArr как новые ключи
    parseForTable(item.props, this.props.tofiConstants, result, constArr);
    // Here goes some data massage
    // Get data of the work case
      // Собираем все id дел в один массив для получения значений свойств дел следующим запросом
    if(result.workRegCase) {
      this.workRegCaseIds.push(result.workRegCase.value)
    }
    result.workStatusUses = result[this.clsStatusMap[item.clsORtr]];

    // result.resultDescription = result.resultDescriptionLng;
    return result;
  };

  render() {
    const {loading, data, search, initialValues } = this.state;
    this.lng = localStorage.getItem('i18nextLng');
    const {t, tofiConstants, tofiConstants: {workDate,
      permitionDate, archiveCipher, documentFile, workRegCase}} = this.props;

    this.filteredData = data.filter(item => {
      return (
         ( item.key.toLowerCase().includes(search.nameResearchers.toLowerCase()) ) &&
         ( search.workTypeClass.length === 0 || search.workTypeClass.some(p => (item.workType && (!!p ? p.value : '' ) == item.workType.value)) ) &&
        ( !search.workDate.dbeg|| moment(item.workDate && item.workDate.value, 'DD-MM-YYYY').isSameOrAfter(search.workDate.dbeg, 'day') ) &&
         ( !search.workDate.dend|| moment(item.workDate && item.workDate.value, 'DD-MM-YYYY').isSameOrAfter(search.workDate.dend, 'day') ) &&
        ( !search.acceptanceDate.dbeg|| moment(item.acceptanceDate && item.acceptanceDate.value, 'DD-MM-YYYY').isSameOrAfter(search.acceptanceDate.dbeg, 'day') ) &&
         ( !search.acceptanceDate.dend || moment(item.acceptanceDate && item.acceptanceDate.value, 'DD-MM-YYYY').isSameOrAfter(search.acceptanceDate.dend, 'day') ) &&
        ( !search.permitionDate.dbeg || moment(item.permitionDate && item.permitionDate.value, 'DD-MM-YYYY').isSameOrAfter(search.permitionDate.dbeg, 'day') ) &&
        ( !search.permitionDate.dend || moment(item.permitionDate && item.permitionDate.value, 'DD-MM-YYYY').isSameOrAfter(search.permitionDate.dend, 'day') )
      )
    });
    return (
      <div className="CabinetCard">
        <div className = "CabinetCard_heading">
          <div className="table-header" style={{ justifyContent: 'unset' }}>
            <div className="label-select" style={{ flex: '0 0 20%' }}>
              <Select
                name="workTypeClass"
                isMulti
                isSearchable={false}
                value={search.workTypeClass}
                onChange={this.onWorkClassChange}
                options={['caseDeliveryToRR', 'orderCopyDoc']
                      .map(c => ({value: tofiConstants[c].id, label: tofiConstants[c].name[this.lng], workTypeClass: c}))}
                placeholder={t('WORK_CLASS')}
                />
            </div>
          </div>
        </div>
        <div className="CabinetCard__body">
          <AntTable
            loading={this.props.loading}
            dataSource={this.filteredData}
            changeSelectedRow={this.changeSelectedRow}
            onChange={this.onChange}
            openedBy="Works"
            columns={[
                {
                    key: 'id',
                    title: t('ID'),
                    dataIndex: 'key',
                    width: '6%',
                    render: key => key ,
                    // render: key => { return key},
                    sorter: (a, b) => parseInt(a.key.split('_')[1] ) - parseInt(b.key.split('_')[1]),
                    sortOrder: 'descend',
                    filterDropdown: (
                        <div className="custom-filter-dropdown">
                          <Input
                              disabled={this.state.openCard}
                              name="nameResearchers"
                              suffix={search.nameResearchers && !this.state.openCard ?
                                  <Icon type="close-circle" data-name="nameResearchers" onClick={this.emitEmpty}/> : null}
                              ref={ele => this.nameResearchers = ele}
                              placeholder="Поиск"
                              value={search.nameResearchers}
                              onChange={this.onInputChange}
                          />
                        </div>
                    ),
                    filterIcon: <Icon type="filter" style={{color: search.nameResearchers ? '#ff9800' : '#aaa'}}/>,
                    onFilterDropdownVisibleChange: (visible) => {
                        this.setState({
                            filterDropdownVisible: visible,
                        }, () => this.nameResearchers.focus());
                    },
                },
                {
                key: 'workType',
                title: t('WORK_CLASS'),
                dataIndex: 'workType',
                width: '7%',
                render: obj => obj && obj.label
              },
              {
                key: 'workDate',
                title: workDate.name[this.lng],
                dataIndex: 'workDate',
                width: '7%',
                filterDropdown: (
                  <div className="custom-filter-dropdown">
                    <div className="flex">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.workDate.dbeg}
                        style={{marginRight: '16px'}}
                        showToday={false}
                        onChange={this.onDateChange('workDate', 'dbeg')}
                      />
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.workDate.dend}
                        showToday={false}
                        onChange={this.onDateChange('workDate', 'dend')}
                      />
                    </div>
                  </div>
                ),
                filterIcon: <Icon type="filter"
                                  style={{color: (search.workDate.dbeg || search.workDate.dend) ? '#ff9800' : '#aaa'}}/>,
                render: obj => obj && obj.value
              },
              {
                key: 'acceptanceDate',
                title: t('ACCEPTANCE_DATE'),
                dataIndex: 'acceptanceDate',
                width: '7%',
                filterDropdown: (
                  <div className="custom-filter-dropdown">
                    <div className="flex">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.acceptanceDate.dbeg}
                        style={{marginRight: '16px'}}
                        showToday={false}
                        onChange={this.onDateChange('acceptanceDate', 'dbeg')}
                      />
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.acceptanceDate.dend}
                        showToday={false}
                        onChange={this.onDateChange('acceptanceDate', 'dend')}
                      />
                    </div>
                  </div>
                ),
                filterIcon: <Icon type="filter"
                                  style={{color: (search.acceptanceDate.dbeg || search.acceptanceDate.dend) ? '#ff9800' : '#aaa'}}/>,
                render: obj =>  obj && obj.value
              },
              {
                key: 'permitionDate',
                title: permitionDate.name[this.lng],
                dataIndex: 'permitionDate',
                width: '10%',
                filterDropdown: (
                  <div className="custom-filter-dropdown">
                    <div className="flex">
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.permitionDate.dbeg}
                        style={{marginRight: '16px'}}
                        showToday={false}
                        onChange={this.onDateChange('permitionDate', 'dbeg')}
                      />
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={this.state.search.permitionDate.dend}
                        showToday={false}
                        onChange={this.onDateChange('permitionDate', 'dend')}
                      />
                    </div>
                  </div>
                ),
                filterIcon: <Icon type="filter"
                                  style={{color: (search.permitionDate.dbeg || search.permitionDate.dend) ? '#ff9800' : '#aaa'}}/>,
                render: obj => obj && obj.value
              },
              {
                key: 'workStatusUses',
                title: t('STATUS'),
                dataIndex: 'workStatusUses',
                width: '11%',
                render: obj => obj && obj.label
              },
              {
                key: 'archiveCipher',
                title: archiveCipher.name[this.lng],
                dataIndex: 'archiveCipher',
                width: '11%',
                render: obj => obj && obj[this.lng]
              },
              {
                key: 'workRegCase',
                title: workRegCase.name[this.lng],
                dataIndex: 'workRegCase',
                width: '35%',
                render: obj =>  obj && obj.label
              },
              {
                key: 'documentFile',
                title: t('ELECTRONIC_IMAGE'),
                dataIndex: 'documentFile',
                width: '6%',
                render: (arr, rec) => {
                  if(arr && arr.length && arr.some(obj => (Number(obj.kz) || Number(obj.ru) || Number(obj.en)))
                    && rec.workStatusCreateRequirement && ['allowed', 'issued']
                    .some(c => this.props.tofiConstants[c].id == rec.workStatusCreateRequirement.value)) {
                    return <Button
                      title={t('SHOW_FILES')}
                      icon="paper-clip"
                      className='green-btn'
                      onClick={e => {
                          this.setState({openModal: true, viewerList: arr.map((obj, idx) => ({name: obj[this.lng], title: idx+1 + ' ' + t('PAGE')}))})

                      }}
                    />
                  }
                  return ''
                }
              },
            ]}
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
              <CabinetCard
                getDocs={this.getDocs}
                user={this.props.user}
                onCreateObj={this.props.onCreateObj}
                t={t}
                tofiConstants={tofiConstants}
                childWorks={initialValues.key ? data.filter(obj => obj.parent === initialValues.key) : []}
                initialValues={initialValues}
              />
            </SiderCard>
          </CSSTransition>
          {<Modal
            visible={this.state.openModal}
            footer={null}
            title={t('VIEWER_REQUEST')}
            wrapClassName={'full-screen'}
            onCancel={() => this.setState({ openModal: false })}
          >
            <Viewer key={this.state.viewerList.toString()} t={t} viewerList={this.state.viewerList}/>
          </Modal>}
        </div>
      </div>
    )
  }
}

export default Requests;