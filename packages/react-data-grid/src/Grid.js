const React                = require('react');
import PropTypes from 'prop-types';
const createReactClass = require('create-react-class');
const Header               = require('./Header');
const Viewport             = require('./Viewport');
const cellMetaDataShape    = require('./PropTypeShapes/CellMetaDataShape');
require('../../../themes/react-data-grid-core.css');

const Grid = createReactClass({
  displayName: 'Grid',

  propTypes: {
    rowGetter: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
    columns: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    columnMetrics: PropTypes.object,
    minHeight: PropTypes.number,
    totalWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    headerRows: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    rowHeight: PropTypes.number,
    rowRenderer: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
    emptyRowsView: PropTypes.func,
    expandedRows: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    selectedRows: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    rowSelection: PropTypes.oneOfType([
      PropTypes.shape({
        indexes: PropTypes.arrayOf(PropTypes.number).isRequired
      }),
      PropTypes.shape({
        isSelectedKey: PropTypes.string.isRequired
      }),
      PropTypes.shape({
        keys: PropTypes.shape({
          values: PropTypes.array.isRequired,
          rowKey: PropTypes.string.isRequired
        }).isRequired
      })
    ]),
    rowsCount: PropTypes.number,
    onRows: PropTypes.func,
    sortColumn: PropTypes.string,
    sortDirection: PropTypes.oneOf(['ASC', 'DESC', 'NONE']),
    rowOffsetHeight: PropTypes.number.isRequired,
    onViewportKeydown: PropTypes.func.isRequired,
    onViewportKeyup: PropTypes.func,
    onViewportDragStart: PropTypes.func.isRequired,
    onViewportDragEnd: PropTypes.func.isRequired,
    onViewportClick: PropTypes.func.isRequired,
    onViewportDoubleClick: PropTypes.func.isRequired,
    onColumnResize: PropTypes.func,
    onSort: PropTypes.func,
    onHeaderDrop: PropTypes.func,
    cellMetaData: PropTypes.shape(cellMetaDataShape),
    rowKey: PropTypes.string.isRequired,
    rowScrollTimeout: PropTypes.number,
    contextMenu: PropTypes.element,
    getSubRowDetails: PropTypes.func,
    draggableHeaderCell: PropTypes.func,
    getValidFilterValues: PropTypes.func,
    rowGroupRenderer: PropTypes.func,
    overScan: PropTypes.object
  },

  componentWillMount() {
    this._scrollLeft = undefined;
    this._DOMMetrics = {
      metrics: {},
      components: []
    };
  },

  componentDidMount() {
    if (window.addEventListener) {
      window.addEventListener('resize', this.updateMetrics);
    } else {
      window.attachEvent('resize', this.updateMetrics);
    }
    this.updateMetrics();
    this._scrollLeft = this.viewport ? this.viewport.getScroll().scrollLeft : 0;
    this._onScroll();
  },

  componentWillUnmount() {
    this._scrollLeft = undefined;
    window.removeEventListener('resize', this.updateMetrics);
  },

  componentDidUpdate() {
    this._onScroll();
  },

  onScroll(props) {
    if (this._scrollLeft !== props.scrollLeft) {
      this._scrollLeft = props.scrollLeft;
      this._onScroll();
    }
  },

  onHeaderScroll(e) {
    let scrollLeft = e.target.scrollLeft;
    if (this._scrollLeft !== scrollLeft) {
      this._scrollLeft = scrollLeft;
      this.header.setScrollLeft(scrollLeft);
      let canvas = ReactDOM.findDOMNode(this.viewport.canvas);
      canvas.scrollLeft = scrollLeft;
      this.viewport.canvas.setScrollLeft(scrollLeft);
    }
  },

  _onScroll() {
    if (this._scrollLeft !== undefined) {
      this.header.setScrollLeft(this._scrollLeft);
      if (this.viewport) {
        this.viewport.setScrollLeft(this._scrollLeft);
      }
    }
  },

  childContextTypes: {
    metricsComputator: PropTypes.object
  },

  getChildContext() {
    return {metricsComputator: this};
  },

  getMetricImpl(name) {
    return this._DOMMetrics.metrics[name].value;
  },

  registerMetricsImpl(component, metrics) {
    let getters = {};
    let s = this._DOMMetrics;

    for (let name in metrics) {
      if (s.metrics[name] !== undefined) {
        throw new Error('DOM metric ' + name + ' is already defined');
      }
      s.metrics[name] = {component, computator: metrics[name].bind(component)};
      getters[name] = this.getMetricImpl.bind(null, name);
    }

    if (s.components.indexOf(component) === -1) {
      s.components.push(component);
    }

    return getters;
  },

  unregisterMetricsFor(component) {
    let s = this._DOMMetrics;
    let idx = s.components.indexOf(component);

    if (idx > -1) {
      s.components.splice(idx, 1);

      let name;
      let metricsToDelete = {};

      for (name in s.metrics) {
        if (s.metrics[name].component === component) {
          metricsToDelete[name] = true;
        }
      }

      for (name in metricsToDelete) {
        if (metricsToDelete.hasOwnProperty(name)) {
          delete s.metrics[name];
        }
      }
    }
  },

  updateMetrics() {
    let s = this._DOMMetrics;

    let needUpdate = false;

    for (let name in s.metrics) {
      if (!s.metrics.hasOwnProperty(name)) continue;

      let newMetric = s.metrics[name].computator();
      if (newMetric !== s.metrics[name].value) {
        needUpdate = true;
      }
      s.metrics[name].value = newMetric;
    }

    if (needUpdate) {
      for (let i = 0, len = s.components.length; i < len; i++) {
        if (s.components[i].metricsUpdated) {
          s.components[i].metricsUpdated();
        }
      }
    }
  },

  getDefaultProps() {
    return {
      rowHeight: 35,
      minHeight: 350
    };
  },

  getStyle: function() {
    return {
      overflow: 'hidden',
      outline: 0,
      position: 'relative',
      minHeight: this.props.minHeight
    };
  },

  render() {
    let headerRows = this.props.headerRows || [{ref: (node) => this.row = node}];
    let EmptyRowsView = this.props.emptyRowsView;

    return (
      <div style={this.getStyle()} className="react-grid-Grid">
        <Header
          ref={(input) => { this.header = input; } }
          columnMetrics={this.props.columnMetrics}
          onColumnResize={this.props.onColumnResize}
          height={this.props.rowHeight}
          totalWidth={this.props.totalWidth}
          headerRows={headerRows}
          sortColumn={this.props.sortColumn}
          sortDirection={this.props.sortDirection}
          draggableHeaderCell={this.props.draggableHeaderCell}
          onSort={this.props.onSort}
          onHeaderDrop={this.props.onHeaderDrop}
          onScroll={this.onHeaderScroll}
          getValidFilterValues={this.props.getValidFilterValues}
          cellMetaData={this.props.cellMetaData}
          />
          {this.props.rowsCount >= 1 || (this.props.rowsCount === 0 && !this.props.emptyRowsView) ?
            <div
              ref={(node) => { this.viewPortContainer = node; } }
              tabIndex="0"
              onKeyDown={this.props.onViewportKeydown}
              onKeyUp={this.props.onViewportKeyup}
              onClick={this.props.onViewportClick}
              onDoubleClick={this.props.onViewportDoubleClick}
              onDragStart={this.props.onViewportDragStart}
              onDragEnd={this.props.onViewportDragEnd}>
                <Viewport
                  ref={(node) => { this.viewport = node; } }
                  rowKey={this.props.rowKey}
                  width={this.props.columnMetrics.width}
                  rowHeight={this.props.rowHeight}
                  rowRenderer={this.props.rowRenderer}
                  rowGetter={this.props.rowGetter}
                  rowsCount={this.props.rowsCount}
                  selectedRows={this.props.selectedRows}
                  expandedRows={this.props.expandedRows}
                  columnMetrics={this.props.columnMetrics}
                  totalWidth={this.props.totalWidth}
                  onScroll={this.onScroll}
                  onRows={this.props.onRows}
                  cellMetaData={this.props.cellMetaData}
                  rowOffsetHeight={this.props.rowOffsetHeight || this.props.rowHeight * headerRows.length}
                  minHeight={this.props.minHeight}
                  rowScrollTimeout={this.props.rowScrollTimeout}
                  contextMenu={this.props.contextMenu}
                  rowSelection={this.props.rowSelection}
                  getSubRowDetails={this.props.getSubRowDetails}
                  rowGroupRenderer={this.props.rowGroupRenderer}
                  overScan={this.props.overScan}
                />
            </div>
        :
            <div ref={(node) => { this.emptyView = node; } } className="react-grid-Empty">
                <EmptyRowsView />
            </div>
        }
      </div>
    );
  }
});

module.exports = Grid;
