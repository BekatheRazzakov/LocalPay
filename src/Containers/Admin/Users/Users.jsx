import React, { useEffect, useState } from 'react';
import Paper from '../../../Components/UI/Paper/Paper';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser, getUsers } from '../../../features/admin/adminThunk';
import { formatDate } from '../../../utils';
import IconButton from '../../../Components/UI/IconButton/IconButton';
import SmallEditIcon from '../../../assets/small-edit-icon.svg';
import SmallDeleteIcon from '../../../assets/small-delete-icon.svg';
import { ROLES } from '../../../constants';
import UserDeleteConfirmation from '../../../Components/UI/UserDeleteConfirmation/UserDeleteConfirmation';
import Select from '../../../Components/UI/Select/Select';
import { jwtDecode } from 'jwt-decode';
import { useAppSelector } from '../../../app/hooks';
import Input from '../../../Components/UI/Input/Input';
import CustomButton from '../../../Components/UI/CustomButton/CustomButton';
import * as XLSX from 'xlsx';
import './users.css';

const Users = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, usersPagesAmount } = useSelector(
    (state) => state.adminState
  );
  const { user } = useAppSelector((state) => state.userState);
  const [usersInDeleteProcess, setUsersInDeleteProcess] = useState([]);
  const [deleteUserId, setDeleteUserId] = useState('');
  const [paginationData, setPaginationData] = useState({
    page: 1,
    page_size: 20,
  });
  const [searchWord, setSearchWord] = useState('');
  const { role } = jwtDecode(user.access || '');
  const [chosenUsers, setChosenUsers] = useState([]);
  const [listAction, setListAction] = useState('');

  useEffect(() => {
    dispatch(
      getUsers({
        ...paginationData,
        searchWord,
      })
    );
  }, [
    // do not add searchWord, dateFilter as deps
    dispatch,
    paginationData,
  ]);

  const handleSearchWordChange = (e) => {
    setSearchWord(e.target.value);
  };

  const searchWithFilters = () => {
    dispatch(
      getUsers({
        ...paginationData,
        searchWord,
      })
    );
  };

  const onListActionChange = (e) => {
    const { value } = e.target;
    setListAction(value || '');
  };

  const onDeleteUser = async (id) => {
    if (id) {
      setUsersInDeleteProcess((prevState) => [...prevState, id]);
      await dispatch(deleteUser(id));
      setUsersInDeleteProcess((prevState) => [
        ...prevState.filter((prevId) => prevId !== id),
      ]);
      toggleDeleteUserModal();
      dispatch(getUsers({ ...paginationData }));
    }
  };

  const toggleDeleteUserModal = (userId) => {
    setDeleteUserId(userId || '');
  };

  const onPaginationDataChange = (e) => {
    const { name, value } = e.target;
    setPaginationData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const onChooseUser = (e, id) => {
    const { checked } = e.target;

    if (id === 'all') {
      if (chosenUsers?.length === users?.length) setChosenUsers(() => []);
      else setChosenUsers(() => [...users?.map((user) => user?.id)]);
      return;
    }

    if (checked) {
      if (chosenUsers.includes(id)) return;
      setChosenUsers([...chosenUsers, id]);
    } else {
      const filteredList = [...chosenUsers].filter((user) => user !== id);
      setChosenUsers(filteredList);
    }
  };

  const handleExcelFileExport = (data) => {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet([]);

    let rowIndex = 1;

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          'ФИО',
          'Баланс',
          'Регион',
          'Дата регистрации',
          'Роль',
          'Статус активности',
          'Планап id',
        ],
      ],
      { origin: `A1` }
    );

    data.forEach((payment) => {
      if (!chosenUsers.includes(payment.id)) return;

      rowIndex += 1;

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            `${payment.name || '-'} ${payment.surname || '-'}`,
            payment.balance || '-',
            payment.region || '-',
            !!payment?.date_reg ? formatDate(payment.date_reg) : '-',
            payment.role || '-',
            payment.is_active || '-',
            payment.planup_id || '-',
          ],
        ],
        { origin: `A${rowIndex}` }
      );
    });

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 17 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи');

    XLSX.writeFile(workbook, 'Пользователи.xlsx');
  };

  const onActionExecute = () => {
    if (listAction === 'uploadChosenOptions' && chosenUsers.length)
      handleExcelFileExport(users);
  };

  return (
    <div className="users">
      <Paper className="home-paper" style={{ maxWidth: '1120px' }}>
        <h1>{usersLoading ? 'Загрузка...' : 'Пользователи'}</h1>
        <div className="user-filters">
          <Input
            size="small"
            placeholder="поиск..."
            onChange={handleSearchWordChange}
          />
          <CustomButton
            size="small"
            rounded
            onClick={searchWithFilters}
            loading={usersLoading}
          >
            Искать...
          </CustomButton>
        </div>
        <div className="users-list-container">
          <table className="users-list">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={chosenUsers?.length === users?.length}
                    onChange={(e) => onChooseUser(e, 'all')}
                  />
                </th>
                <th>№</th>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Область</th>
                <th>Доступный баланс</th>
                <th>Затраты</th>
                <th>Списания</th>
                <th>Пополнения</th>
                <th>Дата регистрации</th>
                <th>Комментарий</th>
                <th>Роль</th>
                <th>Статус</th>
                {['admin'].includes(role) && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => onChooseUser(e, user?.id)}
                      checked={chosenUsers.includes(user?.id)}
                    />
                  </th>
                  <td>{user.id}</td>
                  <td>
                    {user.name || '-'} {user.surname || '-'}
                  </td>
                  <td>{user.login || '-'}</td>
                  <td>{user.region || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {user.balance || 0}
                    <span className="currence-highlight">с</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {user.avail_balance || 0}
                    <span className="currence-highlight">с</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {user.write_off || 0}
                    <span className="currence-highlight">с</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {user.refill || 0}
                    <span className="currence-highlight">с</span>
                  </td>
                  <td>{!!user.date_reg ? formatDate(user.date_reg) : '-'}</td>
                  <td style={{ textAlign: !!user.comment ? 'left' : 'center' }}>
                    {user.comment || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {ROLES.find((role) => role.en === user?.role)?.ru || '-'}
                  </td>
                  <td
                    className={`user-status-${user.is_active ? 'active' : 'inactive'}`}
                  >
                    {user.is_active ? 'активный' : 'заблокирован'}
                  </td>
                  {['admin'].includes(role) && (
                    <td
                      style={{
                        position: 'relative',
                        padding: '0',
                      }}
                    >
                      <div className="user-action-btns">
                        <IconButton
                          icon={SmallEditIcon}
                          color="success"
                          size="20px"
                          linkTo={`/edit-user/${user?.id}`}
                        />
                        <IconButton
                          icon={SmallDeleteIcon}
                          color="error"
                          size="20px"
                          onClick={() => toggleDeleteUserModal(user?.id)}
                          loading={usersInDeleteProcess.includes(user?.id)}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-container">
            <div className="list-actions">
              <div
                className="pagination-field-wrapper"
                style={{ marginLeft: 'auto' }}
              >
                <span className="pagination-field-title">
                  Выберите действие:
                </span>
                <Select size="small" onChange={onListActionChange}>
                  <option value="">-</option>
                  <option value="uploadChosenOptions">
                    Выгрузить выбранные
                  </option>
                </Select>
              </div>
              <CustomButton
                size="small"
                style={{ marginTop: 'auto' }}
                rounded
                onClick={onActionExecute}
              >
                Выполнить
              </CustomButton>
            </div>
            <div
              className="pagination-field-wrapper"
              style={{ marginLeft: 'auto' }}
            >
              <span className="pagination-field-title">
                Пользователей на страницу:
              </span>
              <Select
                size="small"
                name="page_size"
                value={paginationData.page_size}
                onChange={onPaginationDataChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
            <div className="pagination-field-wrapper">
              <span className="pagination-field-title">Страница:</span>
              <Select
                size="small"
                name="page"
                value={paginationData.page}
                onChange={onPaginationDataChange}
              >
                {Array.from({ length: usersPagesAmount || 0 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Paper>
      {!!deleteUserId && (
        <UserDeleteConfirmation
          userId={deleteUserId}
          toggleModal={toggleDeleteUserModal}
          onDeleteUser={onDeleteUser}
        />
      )}
    </div>
  );
};

export default Users;
