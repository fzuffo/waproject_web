import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from '@material-ui/core/LinearProgress';
import Slide from '@material-ui/core/Slide';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import FormValidation from '@react-form-fields/material-ui/components/FormValidation';
import FieldText from '@react-form-fields/material-ui/components/Text';
import Toast from 'components/Shared/Toast';
import { logError } from 'helpers/rxjs-operators/logError';
import useModel from 'hooks/useModel';
import IOrder from 'interfaces/models/order';
import React, { forwardRef, Fragment, memo, useCallback, useState } from 'react';
import { useCallbackObservable } from 'react-use-observable';
import { of } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import orderService from 'services/order';

interface IProps {
  opened: boolean;
  order?: IOrder;
  onComplete: (order: IOrder) => void;
  onCancel: () => void;
}

const useStyle = makeStyles({
  content: {
    width: 400,
    maxWidth: 'calc(95vw - 50px)'
  },
  heading: {
    marginTop: 20,
    marginBottom: 10
  }
});

const OrderFormDialog = memo((props: IProps) => {
  const classes = useStyle(props);

  const [model, setModelProp, setModel, , clearModel] = useModel<IOrder>();
  const [loading, setLoading] = useState<boolean>(true);

  // const [roles, rolesError, , retryRoles] = useRetryableObservable<Array<IUserRole>>(() => {
  //   setLoading(true);

  //   return userService.roles().pipe(
  //     tap(
  //       () => setLoading(false),
  //       () => setLoading(false)
  //     ),
  //     logError()
  //   );
  // }, []);

  const handleEnter = useCallback(() => {
    setModel({ ...props.order });
    // retryRoles();
  }, [props.order, setModel]);

  const handleExit = useCallback(() => {
    clearModel();
  }, [clearModel]);

  const [onSubmit] = useCallbackObservable(
    (isValid: boolean) => {
      return of(isValid).pipe(
        filter(isValid => isValid),
        tap(() => setLoading(true)),
        switchMap(() => orderService.save(model as IOrder)),
        tap(
          order => {
            Toast.show(`${order.description} foi salvo${model.id ? '' : ', um email foi enviado com a senha'}`);
            props.onComplete(order);
            setLoading(false);
          },
          err => {
            Toast.error(err.message === 'email-unavailable' ? 'Email já utlizado' : err);
            setLoading(false);
          }
        ),
        logError()
      );
    },
    [model]
  );

  return (
    <Dialog
      open={props.opened}
      disableBackdropClick
      disableEscapeKeyDown
      onEnter={handleEnter}
      onExited={handleExit}
      TransitionComponent={Transition}
    >
      {loading && <LinearProgress color='secondary' />}

      <FormValidation onSubmit={onSubmit}>
        <DialogTitle>{model.id ? 'Editar' : 'Novo'} Pedidos</DialogTitle>
        <DialogContent className={classes.content}>
          <Fragment>
            <FieldText
              label='Descrição'
              disabled={loading}
              value={model.description}
              validation='required'
              onChange={setModelProp('description', (model, v) => (model.description = v))}
            />

            <FieldText
              label='Quantidade'
              disabled={loading}
              value={model.amount}
              validation='required'
              onChange={setModelProp('amount', (model, v) => (model.amount = v))}
            />

            <FieldText
              label='Valor'
              disabled={loading}
              value={model.value}
              validation='required'
              onChange={setModelProp('value', (model, v) => (model.value = v))}
            />

            <Typography variant='subtitle1' className={classes.heading}>
              Acesso
            </Typography>

            {/* <FieldHidden value={model.roles.length} validation='required|numeric|min:1'>
                <CustomMessage rules='min,required,numeric'>Selecione ao menos um</CustomMessage>
              </FieldHidden> */}

            {/* {(roles || []).map(role => (
                <div key={role.role}>
                  <FieldCheckbox
                    helperText={role.description}
                    checked={model.roles.includes(role.role)}
                    label={role.name}
                    onChange={setModelProp(`role-${role.role}`, model =>
                      model.roles.includes(role.role)
                        ? (model.roles = model.roles.filter(r => r !== role.role))
                        : (model.roles = [...model.roles, role.role])
                    )}
                  />
                </div>
              ))} */}
          </Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onCancel}>Cancelar</Button>
          <Button color='primary' type='submit' disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </FormValidation>
    </Dialog>
  );
});

const Transition = memo(
  forwardRef((props: any, ref: any) => {
    return <Slide direction='up' {...props} ref={ref} />;
  })
);

export default OrderFormDialog;
