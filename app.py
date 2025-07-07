from flask import Flask, render_template, send_from_directory, jsonify, request
import pandas as pd
import os

app = Flask(__name__)

# Helper function for robust column name normalization
def normalize_column_name(col_name):
    """
    Normalizes column names by stripping whitespace and converting to lowercase.
    """
    return str(col_name).strip().lower()

# Route for the main interactive map page
@app.route('/')
def index_page():
    return render_template('index.html')

# NEW ROUTE: To get a unique list of station names for the dropdown
@app.route('/data/station_names')
def station_names():
    file_path = os.path.join('static', 'data', 'meteorological_station_of_nepal.csv')
    try:
        if not os.path.exists(file_path):
            return jsonify({'error': 'Meteorological station file not found'}), 404
        
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df.columns = [normalize_column_name(col) for col in df.columns]
        
        if 'stationname' not in df.columns:
            return jsonify({'error': 'Column "stationname" not found in station data.'}), 400
        
        # *** THE FIX IS HERE ***
        # 1. Drop any rows where stationname is missing (to remove floats/NaN).
        # 2. Get the unique station names.
        # 3. Convert all names to strings to be safe.
        # 4. Sort the list alphabetically.
        unique_stations = df['stationname'].dropna().unique()
        station_list = sorted([str(name) for name in unique_stations])

        return jsonify(station_list) # Return the cleaned and sorted list

    except Exception as e:
        # This will now print a much more informative error to your terminal
        print(f"CRITICAL ERROR in /data/station_names: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/data/precipitation')
def precipitation():
    file_path = os.path.join('static', 'data', 'finaldata', 'cleaned_precipitation_nepalfinal.csv')
    try:
        if not os.path.exists(file_path):
            return jsonify({'error': 'Precipitation file not found'}), 404
        
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df.columns = [normalize_column_name(col) for col in df.columns]
        
        required_cols = ['latitude', 'longitude', 'precipitation', 'year', 'month']
        if not all(col in df.columns for col in required_cols):
            missing = [col for col in required_cols if col not in df.columns]
            return jsonify({'error': f'Crucial columns are missing: {missing}'}), 400
            
        numeric_cols = ['latitude', 'longitude', 'precipitation', 'year']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df['month'] = df['month'].astype(str).str.strip().str.lower()
        df = df[df['month'] != 'nan']

        df = df.dropna(subset=['latitude', 'longitude', 'precipitation', 'year'])
        df['year'] = df['year'].astype(int)

        return jsonify(df.to_dict(orient='records'))
    except Exception as e:
        print(f"Error reading precipitation CSV: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/data/stations')
def stations():
    try:
        file_path = os.path.join('static', 'data', 'meteorological_station_of_nepal.csv') 
        if not os.path.exists(file_path):
            return jsonify({'error': 'Meteorological station file not found'}), 404

        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df.columns = [normalize_column_name(col) for col in df.columns]

        df = df.rename(columns={
            'stationname': 'Station',
            'latitude': 'Latitude',
            'longitude': 'Longitude',
            'index_no': 'Index', 
            'elevation': 'Elevation',
            'district': 'District',
            'typesofstation': 'Type'
        })
        
        df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
        df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')
        df = df.dropna(subset=['Latitude', 'Longitude'])

        output_cols = ['Station', 'Latitude', 'Longitude', 'Elevation', 'District', 'Type']
        df_output = df[[col for col in output_cols if col in df.columns]]

        return jsonify(df_output.to_dict(orient='records'))
    except Exception as e:
        print(f"❌ Error reading station CSV: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    os.makedirs(os.path.join('static', 'data', 'finaldata'), exist_ok=True)
    app.run(debug=True)