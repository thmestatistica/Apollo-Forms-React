/**
 * Componente: AGridTable
 * ------------------------
 * Este componente exibe uma tabela dinâmica usando a biblioteca AG Grid.
 * Ele aplica um tema personalizado e permite receber dados e colunas via props.
 *
 * @param {Array<Object>} dataRows - Dados das linhas da tabela.
 * @param {Array<Object>} nameColumns - Definição das colunas da tabela.
 *
 * @example
 * const data = [
 *   { make: "Toyota", model: "Celica", price: 35000 },
 *   { make: "Ford", model: "Mondeo", price: 32000 },
 * ];
 *
 * const columns = [
 *   { field: "make", headerName: "Marca" },
 *   { field: "model", headerName: "Modelo" },
 *   { field: "price", headerName: "Preço" },
 * ];
 *
 * <AGridTable dataRows={data} nameColumns={columns} />
 */

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react"; // Componente principal da AG Grid
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

// Registro dos módulos necessários da AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

// Criação de um tema personalizado com base no Quartz
const myTheme = themeQuartz.withParams({
  borderColor: "#5A2779",
  browserColorScheme: "light",
  headerBackgroundColor: "#592678",
  headerFontFamily: {
    googleFont: "Space Grotesk",
  },
  headerFontSize: 14,
  headerTextColor: "#FFFFFF",
});

// Componente principal com arrow function
const AGridTable = ({ dataRows = [], nameColumns = [] }) => {
  /**
   * Estado interno (usado apenas como fallback ou para exemplo)
   * Se dataRows e nameColumns forem passados via props, eles serão usados.
   */
  const [rowData, setRowData] = useState(dataRows);
  const [columnDefs, setColumnDefs] = useState(nameColumns);

  // Atualiza o estado sempre que as props mudarem
  useEffect(() => {

    setRowData(dataRows);
    setColumnDefs(nameColumns);

  }, [dataRows, nameColumns]);

    //   Configuração de paginação baseada na quantidade de dados
    let pagination = false;

    if (dataRows.length < 5) {
        pagination = false;
    } else {
        pagination = true;
    }

  return (
    <div className="h-full">
      {/* 
        Aplicação do tema personalizado:
        A AG Grid aceita o tema via prop `theme={myTheme}`
        e a classe CSS padrão `ag-theme-quartz` deve ser mantida
      */}
      <AgGridReact
        theme={myTheme}
        className="ag-theme-quartz"
        rowData={rowData}
        columnDefs={columnDefs}
        domLayout="autoHeight"
        pagination={pagination}
        paginationPageSize={10}
      />
    </div>
  );
};

export default AGridTable;
