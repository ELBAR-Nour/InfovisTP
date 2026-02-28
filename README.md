# Healthcare Visual Analytics Tool

An interactive healthcare data visualization and geospatial analysis platform built with D3.js and ArcGIS JavaScript API.

## 🚀 Live Demo

**→ [Access the deployed application](https://healthcare-dashboard-infovis.netlify.app/)**

Hosted on: Netlify | Built with: D3.js + ArcGIS JavaScript API

## Project Overview

This healthcare visual analytics tool is designed to explore synthetic healthcare data with a focus on understanding patient outcomes, medical conditions, and hospital performance. The application integrates multiple visualization techniques to provide comprehensive insights into healthcare metrics and patterns.

## Objectives

- **Data Preprocessing & Feature Engineering**: Process and transform raw healthcare data for analysis
- **Interactive D3.js Visualizations**: Create dynamic, multi-dimensional visualizations for data exploration
- **Geospatial Analysis**: Visualize hospital locations and patient distribution using ArcGIS JavaScript API
- **Classification Analysis**: Understand test results as a multi-class classification problem and identify influential features

## Dataset

**Source:** [Kaggle - Healthcare Dataset](https://www.kaggle.com/datasets/prasad22/healthcare-dataset/data)

### Target Variable
- **Test Results**: Normal, Abnormal, Inconclusive

### Key Attributes

| Category | Attributes |
|----------|-----------|
| **Patient Info** | Age, Gender, Blood Type |
| **Medical Info** | Medical Condition, Medication, Test Results |
| **Administrative** | Hospital, Doctor, Admission Type, Insurance Provider |
| **Financial** | Billing Amount |
| **Temporal** | Date of Admission, Discharge Date |

## Features & Visualizations

### Part 1: Data Preparation ✓
- **CSV Data Loading**: Asynchronous data import using D3.js and JavaScript
- **Data Cleaning**: Handles missing values and data type conversions
- **Feature Engineering**:
  - Length of stay calculation (Discharge Date - Admission Date)
  - Age group segmentation (0-18, 19-40, 41-65, 65+)
  - Derived metrics for enhanced analysis

### Part 2: D3.js Visualizations ✓

The dashboard includes four core interactive visualizations:

1. **Test Results Distribution**
   - Bar/Pie chart showing the distribution of Normal, Abnormal, and Inconclusive results
   - Proportional analysis of patient outcomes

2. **Medical Conditions vs Test Results**
   - Cross-tabulation visualization
   - Understanding correlation between medical conditions and test outcomes
   - Interactive filtering and drill-down capabilities

3. **Billing Amount Analysis**
   - Distribution of billing amounts by test result category
   - Statistical analysis of healthcare costs
   - Identification of cost patterns and outliers

4. **Patient Demographics**
   - Age group distribution
   - Gender distribution
   - Blood type analysis
   - Insurance provider breakdown

### Interactivity Features
- **Linked Dashboards**: Selection in one chart updates all related visualizations
- **Responsive Filtering**: Dynamic chart updates based on user selections
- **Hover Tooltips**: Detailed information on data points
- **Responsive Design**: Works across desktop and tablet devices

### Part 3: Geospatial Visualization ✓

**ArcGIS Web Map Integration**:
- Hospital locations displayed as interactive markers
- Each hospital marker displays:
  - Hospital name
  - Number of patients treated
  - Average billing amount
  - Dominant test result category
  - Average length of stay

**Interactive Features**:
- **Hospital Selection**: Clicking a hospital marker filters D3 charts to show only that hospital's data
- **Hover Popups**: Summary statistics displayed on hover
- **Zoom & Pan**: Native map navigation for exploring different regions

## Technical Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Core functionality

### Visualization Libraries
- **D3.js** - Interactive data visualizations
- **ArcGIS JavaScript API** - Geospatial mapping and analysis

### Data Processing
- **Papa Parse / Native CSV Parsing** - CSV data loading
- **JavaScript Date APIs** - Temporal data handling

## Project Structure

```
InfovisTP/
├── index.html              # Main HTML entry point
├── README.md              # This file
├── css/
│   └── style.css          # Styling and layout
├── js/
│   ├── data.js            # Data loading and preprocessing
│   ├── analysis.js        # Feature engineering and analysis
│   ├── charts.js          # D3.js visualization components
│   ├── map.js             # ArcGIS map configuration
│   ├── dashboard.js       # Dashboard orchestration and interactivity
│   ├── colorblind.js      # Accessibility - colorblind-friendly palettes
│   └── tooltip.js         # Interactive tooltip functionality
├── data/
│   └── healthcare_dataset.csv # Synthetic healthcare dataset
```

### Local Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd InfovisTP
   ```

2. **Serve locally**
   - Option A: Using Python 3
     ```bash
     python -m http.server 8000
     ```
   - Option B: Using Node.js (http-server)
     ```bash
     npx http-server
     ```
   - Option C: Use VS Code Live Server extension

3. **Open in browser**
   Navigate to `http://localhost:8000`

## Usage

### Exploring the Dashboard

1. **View Data Overview**: Check the D3 visualizations for summary statistics
2. **Analyze Patterns**: Interact with charts to explore relationships between variables
3. **Explore Geographically**: Use the map to locate hospitals and understand regional patterns
4. **Filter & Compare**: Click hospitals on the map to see detailed metrics for specific locations
5. **Accessibility**: Use colorblind-friendly visualizations if needed

### Key Interactions

- **Click on chart segments** to filter related visualizations
- **Hover over elements** to see detailed tooltips
- **Use map zoom** to focus on specific regions
- **Click hospital markers** to drill into hospital-specific data
- **Reset filters** using the dashboard controls to return to the full dataset view

## Data Insights

### Key Findings
- Visualization reveals patterns in test result distribution across demographics
- Billing amount correlates with specific medical conditions
- Hospital performance varies by patient outcome categories
- Age groups show different propensity for abnormal test results

### Feature Importance (From Analytical Perspective)
1. **Medical Condition** - Highest correlation with test results
2. **Age Group** - Strong predictor of outcome
3. **Admission Type** - Significant impact on length of stay
4. **Insurance Provider** - Related to billing patterns
5. **Gender** - Moderate effect on certain conditions

## Accessibility

- **Colorblind-Friendly Palettes**: Implemented alternative color schemes for colorblind users
- **Semantic HTML**: Proper markup for screen reader compatibility
- **Responsive Design**: Works on various screen sizes
- **Hover & Focus States**: Clear interaction feedback

## Future Enhancements

- [ ] Export data and charts to PDF/PNG
- [ ] Advanced filtering and search capabilities
- [ ] Predictive modeling integration
- [ ] Time-series analysis for temporal trends
- [ ] Machine learning model deployment for classification
- [ ] Multi-language support
- [ ] Data comparison tools (hospital vs hospital, region vs region)
- [ ] Mobile app version


## Contributing

This is a student project (TP Infovis 2025). For feedback or improvements, please contact the project team.

## License

Academic use only - Part of Information Visualization course assignment.

## Contact & Support

For questions about this project, please reach out to the development team or course instructor.

---

**Last Updated:** February 2026
**Status:** Active
**Deployment:** [Netlify](https://healthcare-dashboard-infovis.netlify.app/)
