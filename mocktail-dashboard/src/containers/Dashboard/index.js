import React, { useEffect } from "react"
import {
  Container,
  Row,
  Col,
  Button
} from "react-bootstrap"
import Catalog from "../../components/Catalog"
import MockApiDetail from "../../components/MockApiDetail"
import useApis from "../../hooks/useApis"
import { ALL_APIS, DELETE_API } from "../../utils/paths"
import { del, get, post } from "../../utils/request"
export default function Dashboad(props) {
    const { frenchToast } = props;
    const catalog = useApis()


    useEffect(() => {
        async function fetchCatalogApis() {
            const allApis = await get(ALL_APIS)
            catalog.setApis(allApis)
        }
        fetchCatalogApis()
    }, [])

    async function deleteSelectedApi(selectedApi) {
        const url = `${DELETE_API}/${selectedApi.ID}`
        await del(url)
        const allApis = await get(ALL_APIS)
        catalog.setApis(allApis)
    }


    console.log(catalog.apis);

    return (
        <Container  >
            <Row >
                <Col style={{ backgroundColor: 'red' }}>1 of 2</Col>
                <Col style={{ backgroundColor: 'green' }}>2 of 2</Col>
            </Row>
            <Button onClick={() => frenchToast.setToastProps("asd")} />
            <Row>
                <Catalog catalog={catalog} />
                <MockApiDetail catalog={catalog} deleteSelectedApi={deleteSelectedApi} />
            </Row>
        </Container>
    )
  }

