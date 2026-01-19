import React, { useState } from 'react';
import { HStack, VStack, Text, Box, ClipboardRoot, ClipboardTrigger, ClipboardIndicator, Badge, MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuItemGroup, Portal, IconButton, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, Button, Input, Field, NativeSelectRoot, NativeSelectField, DialogActionTrigger } from '@chakra-ui/react';
import { RestProfiles } from '../../styles/profiles';
import PropTypes from 'prop-types';
import { PUBLIC_MOCKTAIL_URL } from '../../utils/paths';
import { showToast, TOASTTYPES } from '../../utils/toast';
import { LuSettings, LuFlaskConical, LuTrash2 } from 'react-icons/lu';

const MockItem = (props) => {
  const { data, selected, showDelayAlways, onStatusCodeClick, statusCodes, onUpdate, onTest, onDelete } = props;
  const { Method, Delay, StatusCode, ID, Endpoint } = data;
  let endpoint = '/' + props.data.Endpoint;
  const fullUrl = `${PUBLIC_MOCKTAIL_URL}${endpoint}`;
  const delay = Delay || 0;
  const statusCode = StatusCode || 200;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedStatusCode, setEditedStatusCode] = useState(statusCode);
  const [editedDelay, setEditedDelay] = useState(delay);
  const [testing, setTesting] = useState(false);

  const handleClick = () => {
    if (!props.disabled && props.onPressAction) {
      props.onPressAction(props.data);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditedStatusCode(statusCode);
    setEditedDelay(delay);
    setEditDialogOpen(true);
  };

  const handleTestClick = async (e) => {
    e.stopPropagation();
    if (onTest) {
      setTesting(true);
      await onTest(data);
      setTimeout(() => setTesting(false), 650);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data);
    }
  };

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(ID, editedStatusCode, editedDelay);
      setEditDialogOpen(false);
    }
  };

  return (
    <>
      <HStack
        gap={1.5}
        width="100%"
        py={1}
        px={2}
        borderRadius="sm"
        onClick={handleClick}
        cursor={!props.disabled ? 'pointer' : 'default'}
        transition="all 0.15s"
        bg={selected ? 'blue.50' : 'transparent'}
        _hover={!props.disabled ? { bg: 'gray.50' } : {}}
      >
      <Text
        fontSize="xs"
        fontWeight="600"
        color={RestProfiles[Method]}
        minW="45px"
        textAlign="left"
      >
        {Method}
      </Text>
      <Text
        fontSize="xs"
        fontFamily="mono"
        color="gray.700"
        flex="1"
        isTruncated
      >
        {endpoint}
      </Text>

      {(delay > 0 || showDelayAlways) && (
        <Badge
          size="xs"
          colorPalette="orange"
          variant="subtle"
          fontSize="10px"
          px={1.5}
          py={0.5}
        >
          {delay}ms
        </Badge>
      )}

      {onStatusCodeClick && statusCodes ? (
        <MenuRoot positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
          <MenuTrigger asChild>
            <Badge
              size="xs"
              colorPalette={statusCode >= 200 && statusCode < 300 ? "green" : statusCode >= 400 ? "red" : "gray"}
              variant="subtle"
              fontSize="10px"
              px={1.5}
              py={0.5}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {statusCode}
            </Badge>
          </MenuTrigger>
          <Portal>
            <MenuContent minW="200px" zIndex={1500}>
              {Object.entries(
                statusCodes.reduce((acc, item) => {
                  if (!acc[item.group]) acc[item.group] = [];
                  acc[item.group].push(item);
                  return acc;
                }, {})
              ).map(([group, items]) => (
                <MenuItemGroup key={group} title={group}>
                  {items.map((item) => (
                    <MenuItem
                      key={item.value}
                      value={item.value.toString()}
                      onClick={() => onStatusCodeClick(item.value)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuItemGroup>
              ))}
            </MenuContent>
          </Portal>
        </MenuRoot>
      ) : (
        <Badge
          size="xs"
          colorPalette={statusCode >= 200 && statusCode < 300 ? "green" : statusCode >= 400 ? "red" : "gray"}
          variant="subtle"
          fontSize="10px"
          px={1.5}
          py={0.5}
        >
          {statusCode}
        </Badge>
      )}

      <ClipboardRoot value={fullUrl} timeout={650}>
        <ClipboardTrigger asChild>
          <Box
            as="span"
            cursor="pointer"
            color="gray.500"
            _hover={{ color: "gray.700" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ClipboardIndicator />
          </Box>
        </ClipboardTrigger>
      </ClipboardRoot>

      {props.disabled && onDelete && (
        <Box
          as="span"
          cursor="pointer"
          color="gray.500"
          _hover={{ color: "red.500" }}
          onClick={handleDeleteClick}
        >
          <LuTrash2 size={14} />
        </Box>
      )}

      {!props.disabled && onUpdate && (
        <Box
          as="span"
          cursor="pointer"
          color="gray.500"
          _hover={{ color: "gray.700" }}
          onClick={handleEditClick}
        >
          <LuSettings size={14} />
        </Box>
      )}

      {!props.disabled && onTest && (
        <Box
          as="span"
          cursor="pointer"
          color={testing ? "green.500" : "gray.500"}
          _hover={{ color: testing ? "green.600" : "gray.700" }}
          onClick={handleTestClick}
          transition="color 0.2s"
        >
          <LuFlaskConical size={14} />
        </Box>
      )}
    </HStack>

    {!props.disabled && onUpdate && (
      <DialogRoot open={editDialogOpen} onOpenChange={(e) => setEditDialogOpen(e.open)}>
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex="modal"
            maxW="sm"
          >
            <DialogHeader>
              <DialogTitle>Quick Edit: {Method} /{Endpoint}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
                    Response Status Code
                  </Field.Label>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={editedStatusCode}
                      onChange={(e) => setEditedStatusCode(Number(e.target.value))}
                      size="sm"
                    >
                      <optgroup label="Success">
                        <option value="200">200 OK</option>
                        <option value="201">201 Created</option>
                        <option value="204">204 No Content</option>
                      </optgroup>
                      <optgroup label="Client Error">
                        <option value="400">400 Bad Request</option>
                        <option value="401">401 Unauthorized</option>
                        <option value="403">403 Forbidden</option>
                        <option value="404">404 Not Found</option>
                        <option value="422">422 Unprocessable Entity</option>
                        <option value="429">429 Too Many Requests</option>
                      </optgroup>
                      <optgroup label="Server Error">
                        <option value="500">500 Internal Server Error</option>
                        <option value="502">502 Bad Gateway</option>
                        <option value="503">503 Service Unavailable</option>
                        <option value="504">504 Gateway Timeout</option>
                      </optgroup>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
                    Delay (ms)
                  </Field.Label>
                  <Input
                    type="number"
                    value={editedDelay}
                    onChange={(e) => setEditedDelay(Number(e.target.value))}
                    min="0"
                    max="30000"
                    size="sm"
                  />
                </Field.Root>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                colorPalette="blue"
                size="sm"
                onClick={handleSave}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>
    )}
  </>
  );
};

export default MockItem;

MockItem.propTypes = {
  data: PropTypes.any,
  Method: PropTypes.string,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  selected: PropTypes.bool,
  onPressAction: PropTypes.func,
  showDelayAlways: PropTypes.bool,
  onStatusCodeClick: PropTypes.func,
  statusCodes: PropTypes.array,
  onUpdate: PropTypes.func,
  onTest: PropTypes.func,
  onDelete: PropTypes.func
};
